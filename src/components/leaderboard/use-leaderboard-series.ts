import { computed, type Ref } from 'vue';
import type { LeaderboardSummary, LeaderboardTally, Participant } from 'server/lib/models/leaderboard/types.ts';
import { LEADERBOARD_MEASURE } from 'server/lib/models/leaderboard/consts';
import { type SeriesInfoMap, type SeriesTallyish } from '../chart/chart-functions';
import type { TallyMeasure } from 'server/lib/models/tally/consts';

export type LeaderboardSeries = {
  uuid: string;
  name: string;
  color: string;
  avatar: string | null;
  tallies: LeaderboardTally[];
};

type UseLeaderboardSeriesOptions = {
  preferTeams?: boolean;
};
export function useLeaderboardSeries(
  leaderboard: Ref<LeaderboardSummary | null>,
  participants: Ref<Participant[]>,
  selectedMeasure: Ref<TallyMeasure>,
  opts: UseLeaderboardSeriesOptions = {},
) {
  const options: Required<UseLeaderboardSeriesOptions> = Object.assign({
    preferTeams: true,
  }, opts);

  const individualGoalMode = computed(() => {
    return leaderboard.value?.individualGoalMode ?? false;
  });

  const groupByTeam = computed(() => {
    return options.preferTeams && (leaderboard.value?.enableTeams ?? false);
  });

  const teams = computed(() => {
    return leaderboard.value?.teams ?? [];
  });

  const eligibleParticipants = computed<Participant[]>(() => {
    if(leaderboard.value === null) {
      return [];
    }

    return participants.value
      // if it's an individual goal board and you don't have a goal, you're not on the board
      .filter(participant => individualGoalMode.value ? participant.goal !== null : true)
      // if it's a teams-based board and you're not on a team, you're not on the board
      // TODO: maybe a "no team"/"independents" team later?
      .filter(participant => groupByTeam.value ? participant.teamId !== null : true)
      .map(participant => {
        const measure = individualGoalMode.value ? participant.goal!.measure : selectedMeasure.value;
        return {
          ...participant,
          tallies: participant.tallies.filter(tally => tally.measure === measure),
        };
      })
      .filter(participant => participant.tallies.length > 0);
  });

  const series = computed<LeaderboardSeries[]>(() => {
    if(groupByTeam.value) {
      const teamsMap = Object.fromEntries(teams.value.map(team => ([
        team.id,
        {
          uuid: team.uuid,
          name: team.name,
          color: team.color,
          avatar: null,
          tallies: [] as LeaderboardTally[],
          memberCount: 0,
        },
      ])));

      if(individualGoalMode.value) {
        // we have to secretly accumulate and pre-calculate all the percentages here
        // this loop adds each participant's tallies to the team in terms of percentage
        for(const participant of eligibleParticipants.value) {
          const percentTallies: LeaderboardTally[] = convertTalliesToPercentage(participant.tallies, participant);

          teamsMap[participant.teamId!].tallies = teamsMap[participant.teamId!].tallies.concat(percentTallies);
          teamsMap[participant.teamId!].memberCount++;
        }

        // this loop goes through each team and then each date, adds up the percentages and then divides them by the number of participants
        // at the end, we get one tally for each day with the correct percentage as its count
        for(const team of Object.values(teamsMap)) {
          if(team.memberCount === 0) {
            continue;
          }

          const talliesByDate = Object.groupBy(team.tallies, tally => tally.date) as Record<string, LeaderboardTally[]>;
          const combinedTallies = Object.values(talliesByDate).map(tallies => {
            if(tallies.length === 0) {
              return null;
            }

            const combinedPercent = tallies.reduce((total, tally) => total + tally.count, 0) / team.memberCount;
            return {
              uuid: team.uuid,
              date: tallies[0].date,
              measure: LEADERBOARD_MEASURE.PERCENT,
              count: combinedPercent,
            };
          }).filter(tally => tally !== null);

          team.tallies = combinedTallies;
        }
      } else {
        for(const participant of eligibleParticipants.value) {
          teamsMap[participant.teamId!].tallies = teamsMap[participant.teamId!].tallies.concat(participant.tallies);
          teamsMap[participant.teamId!].memberCount++;
        }
      }

      return Object.values(teamsMap);
    } else {
      return eligibleParticipants.value.map(participant => ({
        uuid: participant.uuid,
        name: participant.displayName,
        color: participant.color,
        avatar: participant.avatar,
        tallies: individualGoalMode.value ? convertTalliesToPercentage(participant.tallies, participant) : participant.tallies,
      }));
    }
  });

  const seriesTallies = computed<SeriesTallyish[]>(() => {
    return series.value.flatMap(s => s.tallies.map(tally => ({
      date: tally.date,
      count: tally.count,
      series: s.uuid,
    })));
  });

  const seriesInfo = computed<SeriesInfoMap>(() => {
    const entries = series.value.map(s => ([
      s.uuid,
      {
        uuid: s.uuid,
        name: s.name,
        color: s.color,
      },
    ]));

    return Object.fromEntries(entries);
  });

  return {
    individualGoalMode,
    eligibleParticipants,
    series,
    seriesTallies,
    seriesInfo,
  };
}

function convertTalliesToPercentage(tallies: LeaderboardTally[], participant: Participant) {
  return tallies.map(tally => ({
    uuid: participant.uuid,
    date: tally.date,
    measure: LEADERBOARD_MEASURE.PERCENT,
    count: participant.goal!.count === 0 ? 0 : (tally.count / participant.goal!.count) * 100,
  }));
}

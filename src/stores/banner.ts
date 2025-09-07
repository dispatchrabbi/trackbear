import { Banner } from 'generated/prisma/client';
import { defineStore } from 'pinia';
import { getBanners } from 'src/lib/api/banner.ts';

interface BannerState {
  currentBanners: Banner[] | null;
  closedBannerUuids: string[];
}

export const useBannerStore = defineStore('banner', {
  state: (): BannerState => {
    return {
      currentBanners: null,
      closedBannerUuids: (localStorage.getItem('closed-banners') || '').split(','),
    };
  },
  getters: {
    availableBanners: state => {
      if(state.currentBanners === null) { return []; }

      return state.currentBanners.filter(banner => !state.closedBannerUuids.includes(banner.uuid));
    },
  },
  actions: {
    async populate() {
      if(this.currentBanners === null) {
        const currentBanners = await getBanners();
        this.currentBanners = currentBanners;

        // filter out old closed banners
        const currentUuids = this.currentBanners.map(banner => banner.uuid);
        this.closedBannerUuids = this.closedBannerUuids.filter(uuid => currentUuids.includes(uuid));
        localStorage.setItem('closed-banners', this.closedBannerUuids.join(','));
      }
    },
    closeBanner(bannerUuid: string) {
      this.closedBannerUuids.push(bannerUuid);
      localStorage.setItem('closed-banners', this.closedBannerUuids.join(','));
    },
  },
});

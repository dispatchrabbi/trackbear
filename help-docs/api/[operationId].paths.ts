import { usePaths } from 'vitepress-openapi';
import spec from '../public/openapi/openapi.json' with { type: 'json' };

export default {
  paths: function() {
    return usePaths({ spec })
      .getPathsByVerbs()
      .map(({ operationId, summary }) => {
        // TODO: get vitepress-openapi to allow changing the URLs for endpoint docs
        // const operationParts = operationId.split('_');
        // const operationSlug = [operationParts[0].toLowerCase(), operationParts[1]].join('-');

        return {
          params: {
            operationId,
            // operationSlug,
            pageTitle: summary,
          },
        };
      });
  },
};

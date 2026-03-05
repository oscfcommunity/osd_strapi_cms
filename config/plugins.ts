import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  graphql: {
    config: {
      playgroundAlways: true,
      introspection: true,
    },
  },
});

export default config;

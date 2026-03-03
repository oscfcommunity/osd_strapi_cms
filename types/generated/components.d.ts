import type { Schema, Struct } from '@strapi/strapi';

export interface CommonFeatures extends Struct.ComponentSchema {
  collectionName: 'components_common_features';
  info: {
    displayName: 'features';
  };
  attributes: {
    feature: Schema.Attribute.Text;
  };
}

export interface CommonRoles extends Struct.ComponentSchema {
  collectionName: 'components_common_roles';
  info: {
    displayName: 'roles';
  };
  attributes: {
    role: Schema.Attribute.Text;
  };
}

export interface CommonTags extends Struct.ComponentSchema {
  collectionName: 'components_common_tags';
  info: {
    displayName: 'tags';
  };
  attributes: {
    tagName: Schema.Attribute.String;
  };
}

export interface SpeakersSpeaker extends Struct.ComponentSchema {
  collectionName: 'components_speakers_speakers';
  info: {
    displayName: 'speaker';
  };
  attributes: {
    company: Schema.Attribute.String;
    event: Schema.Attribute.String;
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    link: Schema.Attribute.Text;
    name: Schema.Attribute.String;
    position: Schema.Attribute.String;
    presentationLink: Schema.Attribute.Text;
    presentationTitle: Schema.Attribute.String;
    tags: Schema.Attribute.Component<'common.tags', true>;
  };
}

export interface SpeakersSpeakerSection extends Struct.ComponentSchema {
  collectionName: 'components_speakers_speaker_sections';
  info: {
    displayName: 'speakerSection';
  };
  attributes: {
    segment: Schema.Attribute.String;
    speakers: Schema.Attribute.Component<'speakers.speaker', true>;
    title: Schema.Attribute.Text;
  };
}

export interface SponsorsSponsor extends Struct.ComponentSchema {
  collectionName: 'components_sponsors_sponsors';
  info: {
    displayName: 'sponsor';
  };
  attributes: {
    logo: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    name: Schema.Attribute.String;
    number: Schema.Attribute.Integer;
    website: Schema.Attribute.Text;
  };
}

export interface SponsorsSponsorSection extends Struct.ComponentSchema {
  collectionName: 'components_sponsors_sponsor_sections';
  info: {
    displayName: 'sponsorSection';
  };
  attributes: {
    sponsors: Schema.Attribute.Component<'sponsors.sponsor', true>;
    title: Schema.Attribute.String;
  };
}

export interface TeamsTeam extends Struct.ComponentSchema {
  collectionName: 'components_teams_teams';
  info: {
    displayName: 'team';
  };
  attributes: {
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    linkedin: Schema.Attribute.Text;
    name: Schema.Attribute.String;
    number: Schema.Attribute.Integer;
    roles: Schema.Attribute.Component<'common.roles', true>;
  };
}

export interface TeamsTeamSection extends Struct.ComponentSchema {
  collectionName: 'components_teams_team_sections';
  info: {
    displayName: 'teamSection';
  };
  attributes: {
    description: Schema.Attribute.Text;
    teams: Schema.Attribute.Component<'teams.team', true>;
    title: Schema.Attribute.String;
  };
}

export interface TicketsAlert extends Struct.ComponentSchema {
  collectionName: 'components_tickets_alerts';
  info: {
    displayName: 'alert';
  };
  attributes: {
    classes: Schema.Attribute.Text;
    text: Schema.Attribute.String;
  };
}

export interface TicketsTicket extends Struct.ComponentSchema {
  collectionName: 'components_tickets_tickets';
  info: {
    displayName: 'ticket';
  };
  attributes: {
    alert: Schema.Attribute.Component<'tickets.alert', false>;
    available: Schema.Attribute.Boolean;
    couponCode: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    discountedPrice: Schema.Attribute.String;
    fillingFast: Schema.Attribute.Boolean;
    konfhubUrl: Schema.Attribute.Text;
    linkText: Schema.Attribute.String;
    name: Schema.Attribute.String;
    originalPrice: Schema.Attribute.String;
    popular: Schema.Attribute.Boolean;
    price: Schema.Attribute.String;
    startsOn: Schema.Attribute.DateTime;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'common.features': CommonFeatures;
      'common.roles': CommonRoles;
      'common.tags': CommonTags;
      'speakers.speaker': SpeakersSpeaker;
      'speakers.speaker-section': SpeakersSpeakerSection;
      'sponsors.sponsor': SponsorsSponsor;
      'sponsors.sponsor-section': SponsorsSponsorSection;
      'teams.team': TeamsTeam;
      'teams.team-section': TeamsTeamSection;
      'tickets.alert': TicketsAlert;
      'tickets.ticket': TicketsTicket;
    }
  }
}

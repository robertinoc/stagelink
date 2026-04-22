import { BadRequestException } from '@nestjs/common';
import {
  buildYouTubeChannelUrl,
  normalizeYouTubeChannelReference,
} from './youtube-insights.helpers';

describe('youtube-insights.helpers', () => {
  it('normalizes raw channel ids', () => {
    expect(normalizeYouTubeChannelReference('UC_x5XG1OV2P6uZZ5FSM9Ttw')).toEqual({
      kind: 'channel_id',
      value: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    });
  });

  it('normalizes raw handles', () => {
    expect(normalizeYouTubeChannelReference('@googledevelopers')).toEqual({
      kind: 'handle',
      value: 'googledevelopers',
    });
  });

  it('normalizes youtube channel urls', () => {
    expect(
      normalizeYouTubeChannelReference('https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw'),
    ).toEqual({
      kind: 'channel_id',
      value: 'UC_x5XG1OV2P6uZZ5FSM9Ttw',
    });
  });

  it('normalizes youtube handle urls', () => {
    expect(
      normalizeYouTubeChannelReference('https://www.youtube.com/@googledevelopers/videos'),
    ).toEqual({
      kind: 'handle',
      value: 'googledevelopers',
    });
  });

  it('rejects unsupported youtube urls', () => {
    expect(() =>
      normalizeYouTubeChannelReference('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toThrow(BadRequestException);
  });

  it('builds handle-first channel urls', () => {
    expect(buildYouTubeChannelUrl('UC_x5XG1OV2P6uZZ5FSM9Ttw', 'googledevelopers')).toBe(
      'https://www.youtube.com/@googledevelopers',
    );
    expect(buildYouTubeChannelUrl('UC_x5XG1OV2P6uZZ5FSM9Ttw', null)).toBe(
      'https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw',
    );
  });
});

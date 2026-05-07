'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ProfileFormValues } from '../schemas/profile.schema';

interface ProfileSocialLinksProps {
  form: UseFormReturn<ProfileFormValues>;
  disabled: boolean;
}

type SocialKey = keyof Pick<
  ProfileFormValues,
  | 'instagramUrl'
  | 'tiktokUrl'
  | 'youtubeUrl'
  | 'spotifyUrl'
  | 'soundcloudUrl'
  | 'websiteUrl'
  | 'appleMusicUrl'
  | 'amazonMusicUrl'
  | 'deezerUrl'
  | 'tidalUrl'
  | 'beatportUrl'
  | 'traxsourceUrl'
>;

interface SocialField {
  key: SocialKey;
  label: string;
  placeholder: string;
}

export function ProfileSocialLinks({ form, disabled }: ProfileSocialLinksProps) {
  const t = useTranslations('dashboard.profile');
  const {
    register,
    formState: { errors },
  } = form;

  const socialFields: SocialField[] = [
    {
      key: 'instagramUrl',
      label: t('fields.instagram'),
      placeholder: 'https://instagram.com/yourname',
    },
    { key: 'tiktokUrl', label: t('fields.tiktok'), placeholder: 'https://tiktok.com/@yourname' },
    {
      key: 'youtubeUrl',
      label: t('fields.youtube'),
      placeholder: 'https://youtube.com/@yourchannel',
    },
    {
      key: 'spotifyUrl',
      label: t('fields.spotify'),
      placeholder: 'https://open.spotify.com/artist/...',
    },
    {
      key: 'soundcloudUrl',
      label: t('fields.soundcloud'),
      placeholder: 'https://soundcloud.com/yourname',
    },
    {
      key: 'appleMusicUrl',
      label: t('fields.apple_music'),
      placeholder: 'https://music.apple.com/artist/...',
    },
    {
      key: 'amazonMusicUrl',
      label: t('fields.amazon_music'),
      placeholder: 'https://music.amazon.com/artists/...',
    },
    { key: 'deezerUrl', label: t('fields.deezer'), placeholder: 'https://deezer.com/artist/...' },
    { key: 'tidalUrl', label: t('fields.tidal'), placeholder: 'https://tidal.com/artist/...' },
    { key: 'websiteUrl', label: t('fields.website'), placeholder: 'https://yourwebsite.com' },
  ];

  const storeFields: SocialField[] = [
    {
      key: 'beatportUrl',
      label: t('fields.beatport'),
      placeholder: 'https://beatport.com/artist/...',
    },
    {
      key: 'traxsourceUrl',
      label: t('fields.traxsource'),
      placeholder: 'https://traxsource.com/artists/...',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('sections.social')}</CardTitle>
        <CardDescription>{t('sections.social_hint')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Social & streaming URL fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          {socialFields.map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label htmlFor={key} className="text-sm font-medium">
                {label}
              </label>
              <Input
                id={key}
                type="url"
                placeholder={placeholder}
                disabled={disabled}
                {...register(key)}
              />
              {errors[key] && <p className="text-xs text-destructive">{errors[key]?.message}</p>}
            </div>
          ))}
        </div>

        {/* Contact email (separate row, full width) */}
        <div className="space-y-1.5">
          <label htmlFor="contactEmail" className="text-sm font-medium">
            {t('fields.contact_email')}
          </label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="booking@yourname.com"
            disabled={disabled}
            {...register('contactEmail')}
          />
          {errors.contactEmail && (
            <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
          )}
          <p className="text-xs text-muted-foreground">{t('fields.contact_email_hint')}</p>
        </div>

        {/* Music stores subsection */}
        <div className="space-y-4 border-t pt-4">
          <p className="text-sm font-medium text-muted-foreground">{t('sections.music_stores')}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {storeFields.map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label htmlFor={key} className="text-sm font-medium">
                  {label}
                </label>
                <Input
                  id={key}
                  type="url"
                  placeholder={placeholder}
                  disabled={disabled}
                  {...register(key)}
                />
                {errors[key] && <p className="text-xs text-destructive">{errors[key]?.message}</p>}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

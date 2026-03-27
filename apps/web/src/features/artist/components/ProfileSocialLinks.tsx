'use client';

import type { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { ProfileFormValues } from '../schemas/profile.schema';

interface ProfileSocialLinksProps {
  form: UseFormReturn<ProfileFormValues>;
  disabled: boolean;
}

interface SocialField {
  key: keyof Pick<
    ProfileFormValues,
    'instagramUrl' | 'tiktokUrl' | 'youtubeUrl' | 'spotifyUrl' | 'soundcloudUrl' | 'websiteUrl'
  >;
  label: string;
  placeholder: string;
}

const SOCIAL_FIELDS: SocialField[] = [
  { key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/yourname' },
  { key: 'tiktokUrl', label: 'TikTok', placeholder: 'https://tiktok.com/@yourname' },
  { key: 'youtubeUrl', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'spotifyUrl', label: 'Spotify', placeholder: 'https://open.spotify.com/artist/...' },
  { key: 'soundcloudUrl', label: 'SoundCloud', placeholder: 'https://soundcloud.com/yourname' },
  { key: 'websiteUrl', label: 'Website', placeholder: 'https://yourwebsite.com' },
];

export function ProfileSocialLinks({ form, disabled }: ProfileSocialLinksProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social & Contact</CardTitle>
        <CardDescription>
          Add your links so fans can find you everywhere. Leave blank to hide.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Social URL fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
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
            Contact email
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
          <p className="text-xs text-muted-foreground">
            Public booking or press contact. Not used for login.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

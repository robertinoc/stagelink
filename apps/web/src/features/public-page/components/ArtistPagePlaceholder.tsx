import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Music, Link2, Video, Mail } from 'lucide-react';

interface ArtistPagePlaceholderProps {
  username: string;
}

export function ArtistPagePlaceholder({ username }: ArtistPagePlaceholderProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-zinc-950">
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-zinc-700" />
          <h1 className="text-2xl font-bold text-white">@{username}</h1>
          <p className="mt-1 text-sm text-zinc-400">Artist · Musician</p>
          <div className="mt-3 flex justify-center gap-2">
            <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
              Pro
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { icon: Link2, label: 'My Website' },
            { icon: Music, label: 'Latest Track' },
            { icon: Video, label: 'Watch my video' },
          ].map((item) => (
            <Card key={item.label} className="border-zinc-700 bg-zinc-800">
              <CardContent className="flex items-center gap-3 p-4">
                <item.icon className="h-5 w-5 text-zinc-400" />
                <span className="font-medium text-white">{item.label}</span>
              </CardContent>
            </Card>
          ))}

          <Card className="border-zinc-700 bg-zinc-800">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-3">
                <Mail className="h-5 w-5 text-zinc-400" />
                <span className="font-medium text-white">Join my fanlist</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="myemail@gmail.com"
                  className="flex-1 rounded-md bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 border border-zinc-700 outline-none focus:border-zinc-500"
                />
                <Button size="sm">Subscribe</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          Powered by <span className="text-zinc-400">StageLink</span>
        </p>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileQuestion className="h-6 w-6 text-muted-foreground" />
            <CardTitle>Page Not Found</CardTitle>
          </div>
          <CardDescription>
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Link href="/lists" className="flex-1">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                View Lists
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
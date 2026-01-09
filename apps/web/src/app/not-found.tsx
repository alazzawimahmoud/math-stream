import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileQuestion, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="bg-card/80 border-border backdrop-blur-sm max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 bg-primary/20 rounded-full w-fit mb-4">
            <FileQuestion className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-card-foreground text-2xl">Page Not Found</CardTitle>
          <CardDescription className="text-muted-foreground">
            The page yoaau&apos;re looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/">
            <Button className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}


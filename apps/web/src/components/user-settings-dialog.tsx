'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { trpc } from '@/trpc/client';
import { Loader2 } from 'lucide-react';

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const { data: preferences, isLoading } = trpc.user.getPreferences.useQuery(undefined, {
    enabled: open,
  });
  
  const updateMutation = trpc.user.updatePreferences.useMutation({
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  const [enableResultReuse, setEnableResultReuse] = useState(false);

  // Update local state when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setEnableResultReuse(preferences.enableResultReuse);
    }
  }, [preferences]);

  const handleSave = () => {
    updateMutation.mutate({
      enableResultReuse,
    });
  };

  const handleCancel = () => {
    // Reset to original preferences
    if (preferences) {
      setEnableResultReuse(preferences.enableResultReuse);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>User Settings</DialogTitle>
          <DialogDescription>
            Configure your computation preferences
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="result-reuse" className="text-base">
                  Enable result reuse
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, the system will reuse results from identical previous computations (same A, B, and Mode) to speed up processing.
                </p>
              </div>
              <Switch
                id="result-reuse"
                checked={enableResultReuse}
                onCheckedChange={setEnableResultReuse}
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

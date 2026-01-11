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
import { GradientOrb } from '@/components/ui/gradient-orb';
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
      <DialogContent className="sm:max-w-[450px] rounded-3xl neu-raised border-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure your computation preferences
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <GradientOrb variant="blue" size="md" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-muted/50 neu-pressed-sm">
              <div className="space-y-1">
                <Label htmlFor="result-reuse" className="text-sm font-semibold">
                  Enable result reuse
                </Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Reuse results from identical previous computations to speed up processing.
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
        <DialogFooter className="px-6 pb-6 pt-2 gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={updateMutation.isPending}
            className="rounded-full"
          >
            Cancel
          </Button>
          <Button
            variant="pill"
            onClick={handleSave}
            disabled={updateMutation.isPending || isLoading}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

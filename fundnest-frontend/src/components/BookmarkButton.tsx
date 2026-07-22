import { useState } from 'react';
import { Button } from './ui/button';
import { Bookmark, BookmarkCheck } from 'lucide-react';

interface BookmarkButtonProps {
    startupId: string;
    isBookmarked?: boolean;
    onToggle?: (bookmarked: boolean) => void;
}

export function BookmarkButton({ startupId, isBookmarked: initialBookmarked = false, onToggle }: BookmarkButtonProps) {
    const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
    const [isLoading, setIsLoading] = useState(false);

    const handleToggle = async () => {
        setIsLoading(true);
        try {
            if (isBookmarked) {
                // Remove bookmark
                const response = await fetch(`/api/bookmarks/${startupId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) throw new Error('Failed to remove bookmark');

                setIsBookmarked(false);
                onToggle?.(false);
            } else {
                // Add bookmark
                const response = await fetch('/api/bookmarks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({ startupId }),
                });

                if (!response.ok) throw new Error('Failed to add bookmark');

                setIsBookmarked(true);
                onToggle?.(true);
            }
        } catch (error) {
            console.error('Bookmark error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant={isBookmarked ? 'default' : 'outline'}
            size="sm"
            onClick={handleToggle}
            disabled={isLoading}
        >
            {isBookmarked ? (
                <BookmarkCheck className="h-4 w-4 mr-2" />
            ) : (
                <Bookmark className="h-4 w-4 mr-2" />
            )}
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
        </Button>
    );
}

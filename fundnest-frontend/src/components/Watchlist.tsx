import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Bookmark, BookmarkCheck, Trash2, TrendingUp } from 'lucide-react';

interface Startup {
    _id: string;
    name: string;
    sector: string;
    stage: string;
    targetAmount: number;
    raisedAmount: number;
    logo: string;
}

interface BookmarkItem {
    _id: string;
    startup: Startup;
    notes?: string;
    tags?: string[];
    interestLevel: 'Low' | 'Medium' | 'High';
    createdAt: string;
}

export function Watchlist() {
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookmarks();
    }, []);

    const fetchBookmarks = async () => {
        try {
            const response = await fetch('/api/bookmarks', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch bookmarks');

            const data = await response.json();
            setBookmarks(data.bookmarks || []);
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveBookmark = async (bookmarkId: string) => {
        try {
            const response = await fetch(`/api/bookmarks/${bookmarkId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error('Failed to remove bookmark');

            setBookmarks(prev => prev.filter(b => b._id !== bookmarkId));
        } catch (error) {
            console.error('Error removing bookmark:', error);
        }
    };

    const getInterestColor = (level: string) => {
        switch (level) {
            case 'High': return 'bg-green-500';
            case 'Medium': return 'bg-yellow-500';
            case 'Low': return 'bg-orange-500';
            default: return 'bg-gray-500';
        }
    };

    const calculateProgress = (raised: number, target: number) => {
        if (target === 0) return 0;
        return Math.round((raised / target) * 100);
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">Loading watchlist...</div>
                </CardContent>
            </Card>
        );
    }

    if (bookmarks.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bookmark className="h-5 w-5" />
                        Watchlist
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <BookmarkCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No startups in your watchlist yet.</p>
                        <p className="text-sm mt-2">Bookmark startups to track them here.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bookmark className="h-5 w-5" />
                    Watchlist
                    <Badge variant="outline">{bookmarks.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[600px]">
                    <div className="space-y-4">
                        {bookmarks.map((bookmark) => (
                            <div
                                key={bookmark._id}
                                className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">{bookmark.startup.logo}</div>
                                        <div>
                                            <h4 className="font-semibold">{bookmark.startup.name}</h4>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {bookmark.startup.sector}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    {bookmark.startup.stage}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveBookmark(bookmark._id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="mt-3 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Funding Progress</span>
                                        <span className="font-semibold">
                                            {calculateProgress(bookmark.startup.raisedAmount, bookmark.startup.targetAmount)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-secondary rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all"
                                            style={{
                                                width: `${calculateProgress(bookmark.startup.raisedAmount, bookmark.startup.targetAmount)}%`,
                                            }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>${(bookmark.startup.raisedAmount / 1000).toFixed(0)}K raised</span>
                                        <span>of ${(bookmark.startup.targetAmount / 1000).toFixed(0)}K</span>
                                    </div>
                                </div>

                                {bookmark.notes && (
                                    <div className="mt-3 p-2 bg-muted rounded text-sm">
                                        <span className="font-medium">Notes:</span> {bookmark.notes}
                                    </div>
                                )}

                                <div className="mt-3 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getInterestColor(bookmark.interestLevel)}`} />
                                    <span className="text-xs text-muted-foreground">
                                        {bookmark.interestLevel} Interest
                                    </span>
                                </div>

                                {bookmark.tags && bookmark.tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {bookmark.tags.map((tag, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}

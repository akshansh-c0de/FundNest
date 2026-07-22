import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface DocumentUploadProps {
    startupId: string;
    onUploadComplete?: (document: any) => void;
}

export function DocumentUpload({ startupId, onUploadComplete }: DocumentUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [documentType, setDocumentType] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setUploadStatus('idle');
        }
    };

    const handleUpload = async () => {
        if (!file || !documentType) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadStatus('idle');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        formData.append('startupId', startupId);

        try {
            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setUploadStatus('success');
            onUploadComplete?.(data.document);

            // Reset form after delay
            setTimeout(() => {
                setFile(null);
                setDocumentType('');
                setUploadProgress(0);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }, 2000);
        } catch (error) {
            console.error('Upload error:', error);
            setUploadStatus('error');
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            setUploadStatus('idle');
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Document
                </CardTitle>
                <CardDescription>
                    Upload pitch decks, business plans, or financial statements
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="document-type">Document Type</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pitch_deck">Pitch Deck</SelectItem>
                            <SelectItem value="business_plan">Business Plan</SelectItem>
                            <SelectItem value="financial_statement">Financial Statement</SelectItem>
                            <SelectItem value="legal_document">Legal Document</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                            {file ? (
                                <>
                                    <FileText className="h-8 w-8 text-primary" />
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        Drag and drop a file here, or click to select
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        PDF, Word, PowerPoint, Excel, Images (Max 10MB)
                                    </p>
                                </>
                            )}
                        </div>
                    </label>
                </div>

                {uploading && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} />
                    </div>
                )}

                {uploadStatus === 'success' && (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Document uploaded successfully</span>
                    </div>
                )}

                {uploadStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Upload failed. Please try again.</span>
                    </div>
                )}

                <Button
                    onClick={handleUpload}
                    disabled={!file || !documentType || uploading}
                    className="w-full"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Document
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}

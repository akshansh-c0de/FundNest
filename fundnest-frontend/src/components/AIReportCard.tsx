import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Brain, Trending UP, AlertTriangle, CheckCircle2, Target, BarChart3 } from 'lucide-react';

interface AIReportCardProps {
    type: 'pitch_analysis' | 'swot_analysis' | 'risk_score' | 'funding_readiness' | 'business_model';
    data: any;
    loading?: boolean;
}

export function AIReportCard({ type, data, loading }: AIReportCardProps) {
    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-center h-32">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-center text-muted-foreground">No data available</p>
                </CardContent>
            </Card>
        );
    }

    const renderContent = () => {
        switch (type) {
            case 'pitch_analysis':
                return (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Brain className="h-4 w-4" />
                                Summary
                            </h4>
                            <p className="text-sm text-muted-foreground">{data.summary}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-2 text-green-600">Strengths</h4>
                                <ul className="text-sm space-y-1">
                                    {data.strengths?.map((s: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <CheckCircle2 className="h-3 w-3 mt-1 flex-shrink-0" />
                                            <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2 text-orange-600">Weaknesses</h4>
                                <ul className="text-sm space-y-1">
                                    {data.weaknesses?.map((w: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <AlertTriangle className="h-3 w-3 mt-1 flex-shrink-0" />
                                            <span>{w}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Clarity Score</span>
                                    <span className="font-semibold">{data.clarity_score}/10</span>
                                </div>
                                <Progress value={data.clarity_score * 10} />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Persuasiveness Score</span>
                                    <span className="font-semibold">{data.persuasiveness_score}/10</span>
                                </div>
                                <Progress value={data.persuasiveness_score * 10} />
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Overall Score</span>
                                    <span className="font-semibold">{data.overall_score}/10</span>
                                </div>
                                <Progress value={data.overall_score * 10} />
                            </div>
                        </div>
                    </div>
                );

            case 'swot_analysis':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-green-50 dark:bg-green-950">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <TrendingUP className="h-4 w-4 text-green-600" />
                                    Strengths
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm space-y-1">
                                    {data.strengths?.map((s: string, i: number) => (
                                        <li key={i}>• {s}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="bg-orange-50 dark:bg-orange-950">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                                    Weaknesses
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm space-y-1">
                                    {data.weaknesses?.map((w: string, i: number) => (
                                        <li key={i}>• {w}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-50 dark:bg-blue-950">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Target className="h-4 w-4 text-blue-600" />
                                    Opportunities
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm space-y-1">
                                    {data.opportunities?.map((o: string, i: number) => (
                                        <li key={i}>• {o}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 dark:bg-red-950">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-600" />
                                    Threats
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm space-y-1">
                                    {data.threats?.map((t: string, i: number) => (
                                        <li key={i}>• {t}</li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 'risk_score':
                const riskColor = data.risk_category === 'Low' ? 'green' : 
                                 data.risk_category === 'Medium' ? 'yellow' :
                                 data.risk_category === 'High' ? 'orange' : 'red';
                return (
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="text-4xl font-bold mb-2">{data.overall_risk_score}</div>
                            <Badge variant="outline" className={`text-${riskColor}-600 border-${riskColor}-600`}>
                                {data.risk_category} Risk
                            </Badge>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-semibold mb-2">Risk Factors</h4>
                            <div className="space-y-2">
                                {data.risk_factors?.map((rf: any, i: number) => (
                                    <div key={i} className="text-sm p-2 bg-muted rounded">
                                        <div className="font-medium">{rf.factor}</div>
                                        <div className="text-muted-foreground">{rf.description}</div>
                                        <Badge variant="outline" className="mt-1">{rf.impact}</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-semibold mb-2">Mitigation Strategies</h4>
                            <ul className="text-sm space-y-1">
                                {data.mitigation_strategies?.map((ms: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <CheckCircle2 className="h-3 w-3 mt-1 flex-shrink-0" />
                                        <span>{ms}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                );

            case 'funding_readiness':
                const readinessColor = data.readiness_level === 'High' ? 'green' :
                                    data.readiness_level === 'Medium' ? 'yellow' :
                                    data.readiness_level === 'Low' ? 'orange' : 'red';
                return (
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="text-4xl font-bold mb-2">{data.readiness_score}%</div>
                            <Badge variant="outline" className={`text-${readinessColor}-600 border-${readinessColor}-600`}>
                                {data.readiness_level} Readiness
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-2">{data.estimated_timeline}</p>
                        </div>
                        <Separator />
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Readiness Progress</span>
                                <span className="font-semibold">{data.readiness_score}%</span>
                            </div>
                            <Progress value={data.readiness_score} />
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-2 text-green-600">Strengths</h4>
                                <ul className="text-sm space-y-1">
                                    {data.strengths?.map((s: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <CheckCircle2 className="h-3 w-3 mt-1 flex-shrink-0" />
                                            <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2 text-orange-600">Gaps</h4>
                                <ul className="text-sm space-y-1">
                                    {data.gaps?.map((g: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <AlertTriangle className="h-3 w-3 mt-1 flex-shrink-0" />
                                            <span>{g}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                );

            case 'business_model':
                return (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Business Model Type
                            </h4>
                            <Badge variant="outline">{data.business_model_type}</Badge>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-2">Revenue Streams</h4>
                                <ul className="text-sm space-y-1">
                                    {data.revenue_streams?.map((rs: string, i: number) => (
                                        <li key={i}>• {rs}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Cost Structure</h4>
                                <ul className="text-sm space-y-1">
                                    {data.cost_structure?.map((cs: string, i: number) => (
                                        <li key={i}>• {cs}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-semibold mb-2">Value Proposition</h4>
                            <p className="text-sm text-muted-foreground">{data.value_proposition}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Competitive Advantage</h4>
                            <p className="text-sm text-muted-foreground">{data.competitive_advantage}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Scalability Assessment</h4>
                            <p className="text-sm text-muted-foreground">{data.scalability_assessment}</p>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span>Sustainability Score</span>
                                <span className="font-semibold">{data.sustainability_score}/10</span>
                            </div>
                            <Progress value={data.sustainability_score * 10} />
                        </div>
                    </div>
                );

            default:
                return <p>Unknown report type</p>;
        }
    };

    const getTitle = () => {
        switch (type) {
            case 'pitch_analysis': return 'Pitch Analysis';
            case 'swot_analysis': return 'SWOT Analysis';
            case 'risk_score': return 'Risk Assessment';
            case 'funding_readiness': return 'Funding Readiness';
            case 'business_model': return 'Business Model Analysis';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    {getTitle()}
                </CardTitle>
                <CardDescription>AI-powered analysis</CardDescription>
            </CardHeader>
            <CardContent>
                {renderContent()}
            </CardContent>
        </Card>
    );
}

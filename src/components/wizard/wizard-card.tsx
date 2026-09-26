import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

/** One step of a step-by-step flow: progress, title, one question, footer buttons. */
export function WizardCard(props: {
  step: number;
  total: number;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {props.step} of {props.total}
          </span>
        </div>
        <Progress value={(props.step / props.total) * 100} />
        <CardTitle className="pt-2 text-2xl">{props.title}</CardTitle>
        {props.description && <CardDescription>{props.description}</CardDescription>}
      </CardHeader>
      <CardContent>{props.children}</CardContent>
      <CardFooter className="justify-between">{props.footer}</CardFooter>
    </Card>
  );
}

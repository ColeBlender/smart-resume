"use client";

import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import type { Rating } from "@/lib/scoring";
import { RatingPicker } from "./rating-picker";

export function SkillRatingItem(props: {
  name: string;
  hint?: string | null;
  evidence?: string | null;
  aiRated?: boolean;
  value: Rating | undefined;
  onChange: (rating: Rating) => void;
  children?: React.ReactNode;
}) {
  return (
    <Item variant="outline">
      <ItemContent className="min-w-56">
        <ItemTitle>
          {props.name}
          {props.aiRated && (
            <Badge variant="secondary">
              <Sparkles /> From your resume
            </Badge>
          )}
        </ItemTitle>
        {props.evidence ? (
          <ItemDescription className="italic">&ldquo;{props.evidence}&rdquo;</ItemDescription>
        ) : (
          props.hint && <ItemDescription>{props.hint}</ItemDescription>
        )}
      </ItemContent>
      <ItemActions>
        <RatingPicker value={props.value} onChange={props.onChange} />
      </ItemActions>
      {props.children}
    </Item>
  );
}

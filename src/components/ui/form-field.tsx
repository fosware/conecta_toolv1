"use client";

import { ComponentPropsWithoutRef, forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type BaseProps = {
  label?: string;
  error?: string;
  className?: string;
};

type InputFormFieldProps = BaseProps &
  ComponentPropsWithoutRef<typeof Input> & {
    textarea?: false;
  };

type TextareaFormFieldProps = BaseProps &
  ComponentPropsWithoutRef<typeof Textarea> & {
    textarea: true;
  };

type FormFieldProps = InputFormFieldProps | TextareaFormFieldProps;

const FormField = forwardRef(function FormField(
  { label, error, textarea, className, ...props }: FormFieldProps,
  ref: React.ForwardedRef<HTMLInputElement | HTMLTextAreaElement>
) {
  const id = props.id || props.name;
  //const Component = textarea ? Textarea : Input;

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className={error ? "text-destructive" : ""}>
          {label}
        </Label>
      )}
      {textarea ? (
        <Textarea
          {...(props as ComponentPropsWithoutRef<typeof Textarea>)}
          ref={ref as React.ForwardedRef<HTMLTextAreaElement>}
          id={id}
          className={cn(error && "border-destructive", className)}
        />
      ) : (
        <Input
          {...(props as ComponentPropsWithoutRef<typeof Input>)}
          ref={ref as React.ForwardedRef<HTMLInputElement>}
          id={id}
          className={cn(error && "border-destructive", className)}
        />
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
});

FormField.displayName = "FormField";

export { FormField };

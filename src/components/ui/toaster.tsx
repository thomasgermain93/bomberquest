import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

// Icône pixel selon la variante
const TOAST_ICON: Record<string, string> = {
  default: "▶",
  destructive: "✕",
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = TOAST_ICON[variant ?? "default"] ?? "▶";
        return (
          <Toast key={id} variant={variant} {...props}>
            {/* Icône pixel à gauche */}
            <span className="font-pixel text-[10px] text-primary shrink-0 mt-0.5 leading-none">
              {variant === "destructive" ? "✕" : icon}
            </span>
            <div className="flex flex-col gap-0.5 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

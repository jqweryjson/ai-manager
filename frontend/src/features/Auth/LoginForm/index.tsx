import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextField } from "@consta/uikit/TextField";
import { Button } from "@consta/uikit/Button";
import { Checkbox } from "@consta/uikit/Checkbox";
import { loginSchema, type LoginFormData } from "@shared/lib/validation";

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
  loading?: boolean;
}

export const LoginForm = ({ onSubmit, loading }: LoginFormProps) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-m)",
      }}
    >
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <div style={{ width: "100%" }}>
            <TextField
              {...field}
              label="Email"
              type="email"
              placeholder="example@mail.com"
              status={errors.email ? "alert" : undefined}
              caption={errors.email?.message}
              autoComplete="email"
            />
          </div>
        )}
      />

      <Controller
        name="password"
        control={control}
        render={({ field }) => (
          <div style={{ width: "100%" }}>
            <TextField
              {...field}
              label="Пароль"
              type="password"
              placeholder="••••••••"
              status={errors.password ? "alert" : undefined}
              caption={errors.password?.message}
              autoComplete="current-password"
            />
          </div>
        )}
      />

      <Controller
        name="remember"
        control={control}
        render={({ field: { value, onChange } }) => (
          <Checkbox
            checked={value}
            onChange={e => onChange(e.target.checked)}
            label="Запомнить меня"
          />
        )}
      />

      <Button
        label="Войти"
        view="primary"
        size="l"
        width="full"
        type="submit"
        loading={loading}
      />
    </form>
  );
};

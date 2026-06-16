import { I18nProvider } from "../components/i18n";
import AuthForm from "../components/AuthForm";

export default function LoginPage() {
  return (
    <I18nProvider>
      <AuthForm mode="signin" />
    </I18nProvider>
  );
}

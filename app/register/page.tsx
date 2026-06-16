import { I18nProvider } from "../components/i18n";
import AuthForm from "../components/AuthForm";

export default function RegisterPage() {
  return (
    <I18nProvider>
      <AuthForm mode="signup" />
    </I18nProvider>
  );
}

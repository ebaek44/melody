/// This is the login page for google login and once logged inw ith google it will redirect you to the profile page where they can connect spotify
import LoginButton from "@/components/login/loginbutton";

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>

        {/* Google Login */}
        <LoginButton provider="google" callbackUrl="/profile" />
      </div>
    </main>
  );
}

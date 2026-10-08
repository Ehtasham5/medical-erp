import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f6f4] p-5">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0f766e]">Nexora Health</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#18211d]">Create your account</h1>
          <p className="mt-2 text-sm text-[#65736b]">Set up secure access for your branch.</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}

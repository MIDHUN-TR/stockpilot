import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center font-bold text-2xl">Welcome StockPilot App </div>
        
        <Link href={"/register"} className="rounded-2xl m-2 w-[200px] bg-orange-100 py-3 text-black font-semibold text-center">Register</Link>
        
        <Link href={"/login"} className="rounded-2xl w-[200px] bg-orange-100 py-3 text-black font-semibold text-center">Login</Link>
      </div>
    </>
  );
}

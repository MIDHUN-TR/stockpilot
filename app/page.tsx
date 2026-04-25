import Link from "next/link";

export default function Home() {
  return (
    <>
    <div>Welcome StockPilot App </div>
    <p>Are you New User?</p>
    <Link href={'/register'}> Click here to register</Link>
    <p>Are you already existing User?</p>
    <Link href={'/login'}>Click it here to Login </Link>
    </>
    

  );
}

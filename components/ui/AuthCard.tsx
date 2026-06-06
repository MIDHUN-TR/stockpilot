"use client";

type props = {
    children:React.ReactNode
}
export default function Card({children}:props) {
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-black-100">
        <div className="bg-black p-6 rounded-lg shadow-md w-full max-w-sm">
            {children}
        </div>
      </div>
    </>
  );
}

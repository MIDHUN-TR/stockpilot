"use client"

import React from "react";
import AuthButton from "../ui/AuthButton";
import AuthInput from "../ui/AuthInput";
import PasswordValidator from "../ui/AuthPassword";
import Link from "next/link";

export default function LoginForm(){
    async function handleSubmit(e:React.SubmitEvent<HTMLFormElement>){
        e.preventDefault()

        const formData = new FormData(e.currentTarget)

        const data = {
            email:formData.get("email"),
            password:formData.get("password")
        }

        console.log("Login Data : ",data)

    }
   
    return(
        <>
        <form onSubmit={handleSubmit}>
            <h1 className="text-xl py-3 font-semibold text-center">Login</h1>
            <AuthInput type="email" label="Enter Your email" name="email" error="Please check your email"  />
            <PasswordValidator label="password" name="password"/>
            <Link href="" ><p className="text-end text-blue-600">Reset Password</p></Link>
            <AuthButton label="Sign In" />
            </form>
        </>
    )
}
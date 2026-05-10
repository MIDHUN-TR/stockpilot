"use client"

import React from "react";
import AuthButton from "../ui/AuthButton";
import AuthInput from "../ui/AuthInput";
import PasswordValidator from "../ui/AuthPassword";
import Link from "next/link";

export default function LoginForm(){
   
    return(
        <>
        <form action="submit">
            <h1 className="text-xl py-3 font-semibold text-center">Login</h1>
            <AuthInput type="email" label="Enter Your email" error="Please check your email"  />
            <PasswordValidator label="password" name="Enter Your password"/>
            <Link href="" ><p className="text-end text-blue-600">Reset Password</p></Link>
            <AuthButton label="Sign In" />
            </form>
        </>
    )
}
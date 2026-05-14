"use client"
import AuthButton from "../ui/AuthButton";
import AuthInput from "../ui/AuthInput";
import PasswordValidator from "../ui/AuthPassword";


export default function RegisterForm() {
    async function handleSubmit(e:React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const data = {
            name :formData.get("username"),
            email:formData.get("email"),
            password:formData.get("password"),
            confirmPassword : formData.get("confirmpassword")
        }

        if(data.password !== data.confirmPassword){
            alert("Password doen't matching")
            return
        }

        console.log("Registered Data :",data)
        
        
    }
    return (
        <>
            <form onSubmit={handleSubmit} >
                <h1 className="text-xl py-3 font-semibold text-center">Sign Up</h1>
                <AuthInput label="Enter your name" name="username" type="text" className=" my-3" />
                <AuthInput type="email" label="email" name="email" error="Please check your email"  />
                <PasswordValidator label="Password" name="password" />
                <PasswordValidator label="Confirm password" name="confirmpassword" />
                <AuthButton label="Sign Up" />
            </form>

        </>
    )
}
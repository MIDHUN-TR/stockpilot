"use client"
import AuthButton from "../ui/ActionButton";
// Renamed file name convnient to PasswordValidator for better understanding of the component
import AuthInput from "../ui/InputBox";
import PasswordValidator from "../ui/PasswordBox";


export default function RegisterForm() {
    async function handleSubmit(e:React.SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const data = {
            name :formData.get("username") as string,
            email:formData.get("email") as string,
            password:formData.get("password") as string,
            confirmpassword : formData.get("confirmpassword")as string
        }

       try{
        const response = await fetch("/api/auth/register",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify(data)    
        })

        if(!response.ok){
            const errorText = await response.text()
            console.log("Error Details from backend  : ",errorText)
            return
        }
        console.log(response)
        
       }
       catch(e){
            console.log("Something Went Wrong In frontend:",e)
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
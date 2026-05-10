import AuthButton from "../ui/AuthButton";
import AuthInput from "../ui/AuthInput";
import PasswordValidator from "../ui/AuthPassword";


export default function RegisterForm() {
    return (
        <>
            <form action="" >
                <h1 className="text-xl py-3 font-semibold text-center">Sign Up</h1>
                <AuthInput label="Enter your name" type="text" className=" my-3" />
                <AuthInput type="email" label="email" error="Please check your email"  />
                <PasswordValidator label="Password" name="Enter your password" />
                <PasswordValidator label="Confirm password" name="Re-enter Your password" />
                <AuthButton label="Sign Up" />
            </form>

        </>
    )
}
import PasswordValidator from "@/components/ui/AuthPassword"

export default function Login(){
    return(
        <>
            <PasswordValidator label="text" name="Login Into your Account"/>
        <p>Hello this is the login page </p>
        </>
    )
}
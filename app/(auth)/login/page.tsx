import PasswordValidator from "@/components/ui/AuthPassword"

export default function Login(){
    return(
        <>
            <PasswordValidator label="Password" name="Enter Your password"/>
        <p>Hello this is the login page </p>
        </>
    )
}
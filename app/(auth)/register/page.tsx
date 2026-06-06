import RegisterForm from "@/components/forms/RegisterForm";
import Card from "@/components/ui/AuthCard";


export default function Register(){
    return(
        <>
        <Card>
            {<RegisterForm/>}
        </Card>
        </>
    )
}
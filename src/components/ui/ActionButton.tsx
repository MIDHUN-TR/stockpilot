
type props = {
    label : string
}

export default function AuthButton({label}:props){
    return(
        <>
        <button
        type="submit"
        className="w-full bg-black text-blue-600 font-semibold py-2 rounded-md text-[16px] hover:opacity-90"
        >
            {label}
        </button>
        </>
    )
}
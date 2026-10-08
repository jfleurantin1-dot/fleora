import {redirect} from "next/navigation";
export default function Page({params}:{params:{id:string}}){redirect(`/events/${params.id}/services-entertainment#entertainment`);}

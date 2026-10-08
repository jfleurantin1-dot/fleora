import Plan from "@/components/event/venue-logistics-plan";
export default function Page(props:{params:{id:string};searchParams?:{saved?:string}}){return <Plan {...props} groupKey="rentals"/>;}

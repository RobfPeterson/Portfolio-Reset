import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import careerData from "@/data/career.json";
import educationData from "@/data/education.json";
import activityData from "@/data/activites.json";
import { careerSchema, educationSchema ,activitySchema} from "@/lib/schemas";
import Timeline from "./Timeline";

export default function Experience() {
  const career = careerSchema.parse(careerData).career;
  const education = educationSchema.parse(educationData).education;
  const activities = activitySchema.parse(activitiesData).activity;
  return (
    <Tabs defaultValue="work">
      <TabsList className="mb-2 grid w-full grid-cols-3">
        <TabsTrigger value="work">Work</TabsTrigger>
        <TabsTrigger value="education">Education</TabsTrigger>
        <TabsTrigger value="activites">Activites</TabsTrigger>
      </TabsList>
      <TabsContent value="work">
        <Timeline experience={career}></Timeline>
      </TabsContent>
      <TabsContent value="education">
        <Timeline experience={education}></Timeline>
      </TabsContent>
       <TabsContent value="activities">
        <Timeline activities={actitives}></Timeline>
      </TabsContent>
    </Tabs>
  );
}

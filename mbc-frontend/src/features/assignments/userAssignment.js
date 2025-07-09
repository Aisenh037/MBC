import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Custom hook to fetch all assignments
export const useGetAssignments = () => {
  return useQuery({
    queryKey: ["assignments"],
    queryFn: async () => {
      const response = await axios.get("/api/assignments");
      return response.data;
    },
  });
};

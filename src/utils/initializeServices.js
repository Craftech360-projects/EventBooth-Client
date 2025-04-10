import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase/config";

// List of services to be added to Firestore
const SERVICES_LIST = [
  {
    name: "AI Faceswap Photobooth",
    description:
      "Advanced AI-powered photo booth with face swapping capabilities",
  },
  {
    name: "Interactive Floor",
    description: "Dynamic floor projection that responds to movement",
  },
  {
    name: "Aurora LED Strip",
    description: "Programmable LED strip with stunning visual effects",
  },
  {
    name: "Virtual Reality Experience",
    description: "Immersive VR setup for events",
  },
  {
    name: "Augmented Reality Booth",
    description: "AR booth with interactive digital overlays",
  },
];

// Function to initialize services in Firestore
export const initializeServices = async () => {
  try {
    // Check if services already exist
    const servicesCollection = collection(db, "services");
    const servicesSnapshot = await getDocs(servicesCollection);

    // If services collection is empty, add the predefined services
    if (servicesSnapshot.empty) {
      console.log("Initializing services in Firestore...");

      // Add each service to Firestore
      for (const service of SERVICES_LIST) {
        await addDoc(servicesCollection, {
          ...service,
          createdAt: new Date(),
        });
      }

      console.log("Services initialized successfully!");
    } else {
      console.log("Services already exist in Firestore.");
    }
  } catch (error) {
    console.error("Error initializing services:", error);
  }
};

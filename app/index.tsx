// App.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./globals.css";
// 1. Add these imports at the top of your file
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

import { supabase } from "@/supabase";
import { Ionicons } from "@expo/vector-icons";
import { createClient } from "@supabase/supabase-js";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "expo-router";
import "react-native-url-polyfill";

import AdminAddInstructorForm from "../components/AdminAddInstructor"; // أو المسار الصحيح
import AdminStudentForm from "../components/AdminAddStudent"; // أو المسار الصحيح

import { Picker } from "@react-native-picker/picker";
import * as FileSystem from "expo-file-system";

interface SessionProgress {
  in_person_completed: number;
  online_instrument_completed: number;
  theory_completed: number;
  total_sessions: number;
  month: string;
  year: number;
}
// Add this interface and state to your component
interface SessionTypeConfig {
  color: string;
  icon: string;
  bgColor: string;
}

interface GroupedSessions {
  [key: string]: any[];
}

interface StudentSession {
  id: string;
  instructor_name: string;
  student_id: string;
  session_type: "in_person" | "online_instrument" | "theory";
  session_number: number;
  total_sessions: number;
  completed: boolean;
  instructor_id: string;
  feedback?: string;
  comment: number;
  homework_rating?: number;
  sheet?: string;
  HW_comments?: string;
  sheet_url?: string;
  created_at: string;
}

interface StudentProfile {
  id: string;
  name: string;
  instrument: string;
  avatar: string;
  color: string;
  instructor_name?: string;
}
// Add this to your existing types (interfaces)
interface FileItem {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface FolderItem {
  id: string;
  name: string;
  files: FileItem[];
  created_at: string;
  description?: string;
}

// Type definitions
interface Student {
  id: string;
  name: string;
  student_email: string;
  father_email: string;
  user_id: string;
  mother_email: string;
  online_instructor_name: string;
  online_instructor_id: string;
  theory_instructor_name: string;
  theory_instructor_id: string;
  in_person_name: string;
  in_person_id: string;
  created_at: string;
  instrument: string;
  avatar: string;
  color: string;
}

interface LoginForm {
  email: string;
  password: string;
  check: string;
}

interface FeedbackForm {
  comment: number;
  rating: number;
  homework: string;
  feedback: string;
  instructor_id: string;
  check: string;
  uploadedFile: DocumentPicker.DocumentPickerAsset | null;
  instructor_name: string;
  session_type: string;
  session_number: string;
}

interface Instructor {
  id: string;
  name: string;
  phone:string;
  role2:string;
  email: string;
  type: string;
  created_at: string;
  avatar: string;
  color: string;
  password: string;
  role: string;
}



interface AdminStudent {
  id: string;
  name: string;
  instrument: string;
  student_email: string;
  father_email: string;
  mother_email: string;
  instructor_id: string;
  created_at: string;
  avatar: string;
  color: string;
  in_person_id: string;
  in_person_name: string;
  theory_instructor_id: string;
  theory_instructor_name: string;
  online_instructor_id: string;
  online_instructor_name: string;
  mother_phone: string;
  Student_Phone_Number: string;
  father_phone: string;
  password: string;
}
interface FeedbackHistory {
  id: string;
  student_id: string;
  comment: number;
  homework_rating: number;
  sheet: string | null;
  HW_comments: string;
  instructor_id: string;
  session_type: string;
  feedback: string;
  session_number: string;
  created_at: string;
  student_name?: string;
  student_instrument?: string;
  instructor_name?: string;
  instructor_email?: string;
  students?: {
    name: string;
    instrument: string;
  };
  instructors?: {
    name: string;
    email: string;
  };
}

interface StudentForm {
  name: string;
  instrument: string;
  student_email: string;
  father_email: string;
  mother_email: string;
  in_person_id: string;
  in_person_name: string;
  theory_instructor_id: string;
  theory_instructor_name: string;
  online_instructor_id: string;
  online_instructor_name: string;
  instructor_id: string;
  created_at: string;
  mother_phone: string;
  Student_Phone_Number: string;
  father_phone: string;
  password: string;
}

interface InstructorForm {
  name: string;
  role: string;
  phone:string;
  email: string;
  role2:string;
  password: string;
  type: string;
}

// 2. Update ScreenType - Replace the existing type with:
type ScreenType =
  | "login"
  | "dashboard"
  | "feedback"
  | "confirmation"
  | "admin"
  | "admin-students"
  | "admin-instructors"
  | "add-student"
  | "add-instructor"
  | "student-dashboard"
  | "edit-student"
  | "edit-instructor"
  | "admin-student-history"
  | "instructor-student-history"
  | "admin-files";

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

const MusicInstructorApp: React.FC = () => {
  useEffect(() => {
    console.log("Load Data Done")
    loadData();
  }, []);
  // 2. Add these state variables in your main component
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scaleAnim] = useState(new Animated.Value(0.9));
  const [buttonScale] = useState(new Animated.Value(1));
  // Add refs for folder creation form
const folderNameRef = useRef<TextInput>(null);
const folderDescriptionRef = useRef<TextInput>(null);
// بدل state للمدخلات
const folderNameRefValue = useRef("");
const folderDescriptionRefValue = useRef("");



  // Add these state variables in your MusicInstructorApp component
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());
// Add this state for group expansion (add this to your existing useState declarations)
const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set(['Theory', 'Online Practice', 'In-Person']));
// Add these state variables to your main component
const [adminFiles, setAdminFiles] = useState<FolderItem[]>([]);
const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
const [isCreatingFolder, setIsCreatingFolder] = useState(false);
const [newFolderName, setNewFolderName] = useState("");
const [newFolderDescription, setNewFolderDescription] = useState("");
const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());



  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: "instructor" | "student" | "admin";
  } | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null
  );
  // 1. Add these state variables to your existing state declarations
const [selectedAdminStudent, setSelectedAdminStudent] = useState<AdminStudent | null>(null);
const [selectedInstructorStudent, setSelectedInstrucotrStudent] = useState<StudentProfile | null>(null);
const [adminStudentFeedbacks, setAdminStudentFeedbacks] = useState<FeedbackHistory[]>([]);

// Fixed function to handle file uploads to folders
const uploadFileToFolder = async (
  file: any,
  folderId: string
): Promise<string | null> => {
  if (!file) return null;

  try {
    const filePath = `instructor-files/${folderId}/${Date.now()}-${file.name}`;
    const fileUri = file.uri;
    
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error("File does not exist");
    }

    // Read file as base64 first, then convert to ArrayBuffer for Supabase
    const fileData = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to Uint8Array (ArrayBuffer) that Supabase expects
    const binaryString = atob(fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const { error } = await supabase.storage
      .from("instructor-files")
      .upload(filePath, bytes, {
        contentType: file.mimeType || "application/pdf",
        upsert: false,
      });

    if (error) {
      console.error("Upload Error:", error.message);
      Alert.alert("Upload Error", error.message);
      return null;
    }

    const publicUrl = `https://cgzypavgkpiklnzvjoxt.supabase.co/storage/v1/object/public/instructor-files/${filePath}`;
    return publicUrl;
  } catch (err: any) {
    console.error("Upload Exception:", err);
    Alert.alert("Upload Error", err.message || "Unknown error");
    return null;
  }
};

// Fixed function to open files
const openFile = async (url: string, name: string) => {
  try {
    console.log('Attempting to open file:', { url, name });
    
    // Check if it's a PDF and you want to open it in-app
    if (name.toLowerCase().endsWith('.pdf')) {
      // For in-app PDF viewing, you would need a PDF viewer component
      // For now, let's use external opening
      await openFileExternal(url, name);
    } else {
      await openFileExternal(url, name);
    }
  } catch (error) {
    console.error('Error opening file:', error);
    Alert.alert("Error", "Failed to open file");
  }
};

// Fixed function for external file opening
const openFileExternal = async (url: string, name: string) => {
  try {
    // Ensure URL is properly formatted
    let cleanUrl = url.trim();
    
    // Handle URLs that might already be encoded properly
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    
    console.log('Opening URL:', cleanUrl);
    
    // First try with the original URL
    const supported = await Linking.canOpenURL(cleanUrl);
    if (supported) {
      await Linking.openURL(cleanUrl);
      return;
    }
    
    // If that fails, try decoding the URL
    try {
      const decodedUrl = decodeURIComponent(cleanUrl);
      const decodedSupported = await Linking.canOpenURL(decodedUrl);
      if (decodedSupported) {
        await Linking.openURL(decodedUrl);
        return;
      }
    } catch (decodeError) {
      console.log('URL decode failed, trying original');
    }
    
    // If both fail, try downloading and opening locally
    await downloadAndOpenFile(cleanUrl, name);
    
  } catch (error) {
    console.error('Linking error:', error);
    Alert.alert("Error", "Failed to open file. Please check your internet connection.");
  }
};

// Helper function to download and open file locally
const downloadAndOpenFile = async (url: string, fileName: string) => {
  try {
    const downloadDir = FileSystem.cacheDirectory;
    const fileUri = `${downloadDir}${fileName}`;
    
    console.log('Downloading file to:', fileUri);
    
    // Download the file
    const downloadResult = await FileSystem.downloadAsync(url, fileUri);
    
    if (downloadResult.status === 200) {
      // Try to open the downloaded file
      const canOpen = await Linking.canOpenURL(downloadResult.uri);
      if (canOpen) {
        await Linking.openURL(downloadResult.uri);
      } else {
        // Try with file:// protocol
        const fileUrl = `file://${downloadResult.uri}`;
        const canOpenFile = await Linking.canOpenURL(fileUrl);
        if (canOpenFile) {
          await Linking.openURL(fileUrl);
        } else {
          Alert.alert(
            "File Downloaded", 
            `File saved to cache but cannot be opened automatically. You can find it in your device's file manager.`
          );
        }
      }
    } else {
      throw new Error(`Download failed with status: ${downloadResult.status}`);
    }
  } catch (error) {
    console.error('Download error:', error);
    Alert.alert("Error", "Unable to download file. Please check the file URL and your internet connection.");
  }
};
  const [sessionProgress, setSessionProgress] =
    useState<SessionProgress | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [editStudentForm, setEditStudentForm] = useState<StudentForm>({
    name: "",
    instrument: "",
    student_email: "",
    father_email: "",
    mother_email: "",
    in_person_id: "",
    in_person_name: "",
    theory_instructor_id: "",
    theory_instructor_name: "",
    online_instructor_id: "",
    online_instructor_name: "",
    instructor_id: "",
    created_at: "",
    mother_phone: "",
    Student_Phone_Number: "",
    father_phone: "",
    password: "",
  });

  const [editInstructorForm, setEditInstructorForm] = useState<InstructorForm>({
    name: "",
    role: "",
    phone:'',
    email: "",
    password: "",
    role2:"",
    type: "",
  });

  const [editingStudentId, setEditingStudentId] = useState<string>("");
  const [editingInstructorId, setEditingInstructorId] = useState<string>("");

  const [recentSessions, setRecentSessions] = useState<StudentSession[]>([]);

  const [currentScreen, setCurrentScreen] = useState<ScreenType>("login");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loginForm, setLoginForm] = useState<LoginForm>({
    email: "",
    password: "",
    check: "",
  });
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm>({
    comment: 0,
    rating: 0,
    feedback: "",
    homework: `* C major and G major scales - similar motion, contrary-motion, 2 octaves.
* Chromatic scale on C - hands together. (Control fingering, practice slow, control position of your hand).
* ⁠Broken chords C major - play both hands 
* ⁠Believer - confidently two hands together
* ⁠Sparkling Splashes - whole piece hands together. By heart. 1 page - pay attention about all indications (staccato, legato, dynamics). 2 page - work with text more, play slowly, pay attention oboit pauses.`,
    uploadedFile: null,
    instructor_id: "",
    check: "",
    instructor_name: "",
    session_type: "",
    session_number: "",
  });

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [adminStudents, setAdminStudents] = useState<AdminStudent[]>([]);
  const [studentForm, setStudentForm] = useState<StudentForm>({
    name: "",
    instrument: "",
    student_email: "",
    father_email: "",
    in_person_id: "",
    in_person_name: "",
    theory_instructor_id: "",
    theory_instructor_name: "",
    mother_phone: "",
    online_instructor_id: "",
    father_phone: "",
    Student_Phone_Number: "",
    online_instructor_name: "",
    mother_email: "",
    instructor_id: "",
    created_at: "",
    password: "",
  });
  const [instructorForm, setInstructorForm] = useState<InstructorForm>({
    name: "",
    role: "",
    role2:"",
    phone:'',
    email: "",
    type: "",
    password: "",
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [todaySessions, setTodaySessions] = useState<Student[]>([
    {
      id: "1A",
      in_person_id: "dfasfdas",
      user_id: " das",
      name: "Emma Johnson",
      online_instructor_name: "fdsafsda",
      theory_instructor_id: "fdasfdsa",
      theory_instructor_name: "",
      online_instructor_id: "fdsfsdf",
      father_email: "fjkldsaf",
      in_person_name: "",
      mother_email: "fdka;fdasf",
      student_email: "2:00 PM",
      created_at: "2025/5/1",
      instrument: "Piano",
      avatar: "EJ",
      color: "#3B82F6",
    },
  ]);
const handleModalClose = () => {
  setIsCreatingFolder(false);
  folderNameRefValue.current = "";
  folderDescriptionRefValue.current = "";
  folderNameRef.current?.blur();
  folderDescriptionRef.current?.blur();
};

  const handleDelete = (id: string, type: string) => {
    Alert.alert(
      "Delete Confirmation",
      "Are you sure you want to delete this student?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const table = type === "student" ? "students" : "instructors";
            const { error } = await supabase.from(table).delete().eq("id", id);

            if (error) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Something went wrong while deleting.");
            } else {
              console.log("Deleted successfully");
              Alert.alert("Success", "Student deleted successfully.");
              loadData();
              // ممكن تحدث الـ state هنا لو عايز تشيل العنصر من الواجهة
            }
          },
        },
      ]
    );
  };
const handleLogout = async () => {
  await AsyncStorage.removeItem('isLoggedIn');
  await AsyncStorage.removeItem('userRole');
  setLoginForm({
    email: "",
    password: "",
    check: "",
  })
  setCurrentScreen('login');
};
 // Add this function to toggle group expansion
const toggleGroupExpand = (groupType: string) => {
  setExpandedGroupIds(prev => {
    const newSet = new Set(prev);
    if (newSet.has(groupType)) {
      newSet.delete(groupType);
    } else {
      newSet.add(groupType);
    }
    return newSet;
  });
};

  const handleLogin = async (): Promise<void> => {
    setTimeout(async () => {
      if (!loginForm.email) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error || !data?.user) {
        setLoading(false);
        Alert.alert("Login Failed", error?.message || "No user found");
        return;
      }

      const user = data.user;

      // ✅ Admin check
      if (
        loginForm.email === "adham@admin.com" &&
        loginForm.password === "admin123"
      ) {
        setIsAdmin(true);
        setCurrentUser({ id: user.id, role: "admin" });

        if (keepLoggedIn) {
          await AsyncStorage.setItem("keepLoggedIn", "true");
          await AsyncStorage.setItem("initialScreen", "admin");
        }

        setLoading(false);
        setCurrentScreen("admin");
        return;
      }

      // ✅ Check student
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select(
         
        "*"
        )
        .eq("user_id", user.id)
        .single();

      if (studentData && !studentError) {
        setCurrentUser({ id: user.id, role: "student" });
        setStudentProfile({
          id: studentData.id,
          name: studentData.name,
          instrument: studentData.instrument,
          avatar: studentData.avatar,
          color: studentData.color,
          instructor_name: studentData.instructors?.name,
        });

        if (keepLoggedIn) {
          await AsyncStorage.setItem("keepLoggedIn", "true");
          await AsyncStorage.setItem("initialScreen", "student-dashboard");
        }

        setLoading(false);
        setCurrentScreen("student-dashboard");
        loadStudentSessionData(studentData.id);
        return;
      }

      // ✅ Check instructor
      const { data: instructorData, error: instructorError } = await supabase
        .from("instructors")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (instructorData && !instructorError) {
        setCurrentUser({ id: user.id, role: "instructor" });

        const { data: students, error: studentsError } = await supabase
  .from('students')
  .select('*')
  .or(
    `online_instructor_id.eq.${instructorData.id},theory_instructor_id.eq.${instructorData.id},in_person_id.eq.${instructorData.id}`
  );


        if (!studentsError) {
          setTodaySessions(students || []);
        }

        if (keepLoggedIn) {
          await AsyncStorage.setItem("keepLoggedIn", "true");
          await AsyncStorage.setItem("initialScreen", "dashboard");
        }

        setLoading(false);
        setCurrentScreen("dashboard");
        return;
      }

      // ✅ fallback
      setLoading(false);
      Alert.alert("Login Failed", "User not found in system");
    }, 50);
  };

  useEffect(() => {
  const checkSessionAndLoadData = async () => {
    const keepLoggedIn = await AsyncStorage.getItem("keepLoggedIn");

    if (keepLoggedIn !== "true") {
      setCurrentScreen("login");
      return;
    }

    const { data: { session }, error } = await supabase.auth.getSession();

    if (!session || !session.user) {
      console.log("❌ No session found, redirecting to login");
      setCurrentScreen("login");
      return;
    }

    const user = session.user;
    const initialScreen = await AsyncStorage.getItem("initialScreen");

    if (initialScreen === "admin") {
      setIsAdmin(true);
      setCurrentUser({ id: user.id, role: "admin" });
      setCurrentScreen("admin");
      return;
    }

    if (initialScreen === "student-dashboard") {
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select(
          `*,
           online_instructor:online_instructor_id(name),
           theory_instructor:theory_instructor_id(name),
           in_person_instructor:in_person_id(name)`
        )
        .eq("user_id", user.id)
        .single();

      if (studentData && !studentError) {
        setCurrentUser({ id: user.id, role: "student" });
        setStudentProfile({
          id: studentData.id,
          name: studentData.name,
          instrument: studentData.instrument,
          avatar: studentData.avatar,
          color: studentData.color,
          instructor_name: studentData.instructors?.name,
        });
        await loadStudentSessionData(studentData.id);
        setCurrentScreen("student-dashboard");
        return;
      }
    }

    if (initialScreen === "dashboard") {
      const { data: instructorData, error: instructorError } = await supabase
        .from("instructors")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (instructorData && !instructorError) {
        setCurrentUser({ id: user.id, role: "instructor" });

        const { data: students, error: studentsError } = await supabase
          .from("students")
          .select("*")
          .or(
            `online_instructor_id.eq.${instructorData.id},theory_instructor_id.eq.${instructorData.id},in_person_id.eq.${instructorData.id}`
          );

        if (!studentsError) {
          setTodaySessions(students || []);
        }

        setCurrentScreen("dashboard");
        return;
      }
    }

    // fallback
    setCurrentScreen("login");
  };

  checkSessionAndLoadData();
}, []);

// Add this function to handle multiple file uploads
const handleMultipleFileUpload = async (folderId: string) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setUploadingFiles(new Set([folderId]));
      
      const uploadPromises = result.assets.map(async (file) => {
        console.log(folderId)
        const uploadedUrl = await uploadFileToFolder(file, folderId);
        
        if (uploadedUrl) {
          const newFile: FileItem = {
            id: Date.now().toString() + Math.random().toString(),
            name: file.name,
            url: uploadedUrl,
            size: file.size || 0,
            type: file.mimeType || "application/octet-stream",
            uploadedAt: new Date().toISOString(),
            uploadedBy: "Admin",
          };

          return newFile;
        }
        return null;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const validFiles = uploadedFiles.filter((file): file is FileItem => file !== null);

      if (validFiles.length > 0) {
        setAdminFiles(prevFiles => 
          prevFiles.map(folder => 
            folder.id === folderId 
              ? { ...folder, files: [...folder.files, ...validFiles] }
              : folder
          )
        );

       if (validFiles.length > 0) {
  const updatedFolders = adminFiles.map(folder =>
    folder.id === folderId
      ? { ...folder, files: [...folder.files, ...validFiles] }
      : folder
  );
  setAdminFiles(updatedFolders);

  await supabase
    .from("folders")
    .update({ files: updatedFolders.find(f => f.id === folderId)?.files })
    .eq("id", folderId);
    
    Alert.alert("Success", `${validFiles.length} file(s) uploaded successfully!`);
    await fetchFolders();  // ← تعيد تحميل البيانات المحدثة من القاعدة
    setSelectedFolder(null)
  }
}

setUploadingFiles(new Set());
    }
  } catch (err) {
    setUploadingFiles(new Set());
  }
};


  const createNewFolder = async () => {
    console.log("📌 folderNameRefValue:", folderNameRefValue.current);
    console.log("📌 folderDescriptionRefValue:", folderDescriptionRefValue.current);
  type NewFolderItem = Omit<FolderItem, "id">;



    const newFolder: NewFolderItem = {
    name: folderNameRefValue.current.trim(),
    description: folderDescriptionRefValue.current.trim(),
    files: [],
    created_at: new Date().toISOString(),
  };
    const { data, error } = await supabase
  .from("folders")
  .insert([newFolder])
  .select(); // بيرجع array فيها FolderItem كامل (بـ id)


   if (error) {
  console.error("❌ Insert error:", error);
  Alert.alert("Error", error.message);
  return;
}

if (data && data.length > 0) {
  setAdminFiles(prev => [...prev, ...data]); // هنا data فيها الـ id
}

folderNameRefValue.current = "";
folderDescriptionRefValue.current = "";
folderNameRef.current?.clear();
folderDescriptionRef.current?.clear();
setIsCreatingFolder(false);

Alert.alert("Success", "Folder created successfully!");


  };

// Updated delete function with alert confirmation
const deleteFile = async (folderId: string, fileId: string, fileName?: string) => {
  // Show confirmation alert before deleting
  Alert.alert(
    "Delete File", // Title
    `Are you sure you want to delete "${fileName || 'this file'}"? This action cannot be undone.`, // Message
    [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => {
          console.log("File deletion cancelled");
        }
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await performFileDelete(folderId, fileId);
          } catch (error) {
            console.error("Delete error:", error);
            Alert.alert("Error", "Failed to delete file. Please try again.");
          }
        }
      }
    ],
    { cancelable: true } // Allow dismissing by tapping outside (Android)
  );
};

// Separate function to perform the actual deletion
const performFileDelete = async (folderId: string, fileId: string) => {
  const folder = adminFiles.find(f => f.id === folderId);
  if (!folder) {
    Alert.alert("Error", "Folder not found");
    return;
  }

  const fileToDelete = folder.files.find(f => f.id === fileId);
  if (!fileToDelete) {
    Alert.alert("Error", "File not found");
    return;
  }

  try {
    // حذف من Storage
    const storagePath = fileToDelete.url.split("/instructor-files/")[1];
    const { error: storageError } = await supabase.storage
      .from("instructor-files")
      .remove([storagePath]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
      Alert.alert("Error", "Failed to delete file from storage");
      return;
    }

    // تحديث الفولدر في Supabase
    const updatedFiles = folder.files.filter(f => f.id !== fileId);
    const { error: dbError } = await supabase
      .from("folders")
      .update({ files: updatedFiles })
      .eq("id", folderId);

    if (dbError) {
      console.error("Database update error:", dbError);
      Alert.alert("Error", "Failed to update folder in database");
      return;
    }

    // تحديث الـ state
    setAdminFiles(prevFiles =>
      prevFiles.map(f =>
        f.id === folderId ? { ...f, files: updatedFiles } : f
      )
    );

    // Show success message
    Alert.alert("Success", "File deleted successfully");

  } catch (error) {
    console.error("Unexpected error during file deletion:", error);
    Alert.alert("Error", "An unexpected error occurred while deleting the file");
  }
};

// Alternative version with more detailed confirmation
const deleteFileDetailed = async (folderId: string, fileId: string, fileName?: string) => {
  const folder = adminFiles.find(f => f.id === folderId);
  if (!folder) {
    Alert.alert("Error", "Folder not found");
    return;
  }

  const fileToDelete = folder.files.find(f => f.id === fileId);
  if (!fileToDelete) {
    Alert.alert("Error", "File not found");
    return;
  }

  // More detailed confirmation with file info
  Alert.alert(
    "⚠️ Delete File",
    `File: ${fileName || fileToDelete.name || 'Unknown'}
Folder: ${folder.name}

This will permanently delete the file from storage. Are you sure?`,
    [
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Delete Forever",
        style: "destructive",
        onPress: async () => {
          try {
            await performFileDelete(folderId, fileId);
          } catch (error) {
            console.error("Delete error:", error);
            Alert.alert("Error", "Failed to delete file. Please try again.");
          }
        }
      }
    ]
  );
};

// Add this function to delete folders
const deleteFolder = async (folderId: string) => {
  const folder = adminFiles.find(f => f.id === folderId);
  if (!folder) return;

  // حذف كل الملفات من Storage
  const storagePaths = folder.files.map(f =>
    f.url.split("/instructor-files/")[1]
  );
  if (storagePaths.length > 0) {
    await supabase.storage.from("instructor-files").remove(storagePaths);
  }

  // حذف الفولدر من الجدول
  await supabase.from("folders").delete().eq("id", folderId);

  // تحديث الـ state
  setAdminFiles(prevFiles => prevFiles.filter(f => f.id !== folderId));
  if (selectedFolder?.id === folderId) {
    setSelectedFolder(null);
  }
};

// Add this function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
// Add this function to get file icon
const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return 'document-text-outline' as const;
  if (fileType.includes('image')) return 'image-outline' as const;
  if (fileType.includes('video')) return 'videocam-outline' as const;
  if (fileType.includes('audio')) return 'musical-notes-outline' as const;
  if (fileType.includes('word')) return 'document-outline' as const;
  if (fileType.includes('excel') || fileType.includes('sheet')) return 'grid-outline' as const;
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'easel-outline' as const;
  return 'document-outline' as const;
};

// Admin File Manager Screen Component
const RenderAdminFileManager = () => {
  if (selectedFolder) {
    // File List View
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white shadow-sm">
          <View className="px-4 py-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => setSelectedFolder(null)}
                  className="mr-3 p-2"
                >
                  <Ionicons name="chevron-back" size={24} color="#6B7280" />
                </TouchableOpacity>
                <View>
                  <Text className="text-2xl font-bold text-gray-800">
                    {selectedFolder.name}
                  </Text>
                  <Text className="text-gray-600 mt-1">
                    {selectedFolder.files.length} files
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleMultipleFileUpload(selectedFolder.id)}
                disabled={uploadingFiles.has(selectedFolder.id)}
                className="bg-blue-500 px-4 py-2 rounded-full flex-row items-center"
              >
                {uploadingFiles.has(selectedFolder.id) ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={16} color="white" />
                    <Text className="text-white font-medium ml-2">Upload</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Files List */}
        <ScrollView className="flex-1 px-4 py-4">
          {selectedFolder.files.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-20 h-20 bg-gray-200 rounded-full items-center justify-center mb-4">
                <Ionicons name="folder-open-outline" size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500 text-lg font-medium">No files yet</Text>
              <Text className="text-gray-400 text-center mt-2 px-8">
                Upload files to this folder to get started
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {selectedFolder.files.map((file) => (
                <View key={file.id} className="bg-white rounded-2xl mb-1 shadow-sm p-4">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-3">
                        <Ionicons 
                          name={getFileIcon(file.type)} 
                          size={20} 
                          color="#3B82F6" 
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 font-medium" numberOfLines={1}>
                          {file.name}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <Text className="text-gray-500 text-sm">
                            {formatFileSize(file.size)}
                          </Text>
                          <Text className="text-gray-400 text-sm mx-2">•</Text>
                          <Text className="text-gray-500 text-sm">
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => openFile(file.url, file.name)}
                        className="p-2 mr-2"
                      >
                        <Ionicons name="eye-outline" size={20} color="#6B7280" />
                      </TouchableOpacity>
<TouchableOpacity
  onPress={() => deleteFile(selectedFolder.id, file.id, file.name)}
  className="p-2"
>
  <Ionicons name="trash-outline" size={20} color="#EF4444" />
</TouchableOpacity>

                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Folder List View
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white shadow-sm">
        <View className="px-4 py-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setCurrentScreen("admin")}
                className="mr-3 p-2"
              >
                <Ionicons name="chevron-back" size={24} color="#6B7280" />
              </TouchableOpacity>
              <View>
                <Text className="text-2xl font-bold text-gray-800">
                  Instructor Files
                </Text>
                <Text className="text-gray-600 mt-1">
                  {adminFiles.length} folders
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsCreatingFolder(true)}
              className="bg-green-500 px-4 py-2 rounded-full flex-row items-center"
            >
              <Ionicons name="add" size={16} color="white" />
              <Text className="text-white font-medium ml-1">Folder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Folders List */}
      <ScrollView className="flex-1 px-4 py-4">
        {adminFiles.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-20 h-20 bg-gray-200 rounded-full items-center justify-center mb-4">
              <Ionicons name="folder-outline" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-gray-500 text-lg font-medium">No folders yet</Text>
            <Text className="text-gray-400 text-center mt-2 px-8">
              Create your first folder to organize instructor files
            </Text>
          </View>
        ) : (
          <View className="space-y-3">
            {adminFiles.map((folder) => (
              <TouchableOpacity
                key={folder.id}
                onPress={() => setSelectedFolder(folder)}
                className="bg-white rounded-2xl shadow-sm p-6"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 bg-orange-500 rounded-full items-center justify-center mr-4">
                      <Ionicons name="folder" size={24} color="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-800">
                        {folder.name}
                      </Text>
                      <Text className="text-gray-600 text-sm mt-1">
                        {folder.files.length} files
                      </Text>
                      {folder.description && (
                        <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                          {folder.description}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={async (e) => {
                        e.stopPropagation();
                        await deleteFolder(folder.id);
                      }}
                      className="p-2 ml-2"
                    >
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Folder Modal */}
      <Modal
        visible={isCreatingFolder}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/50 items-center justify-center p-4"
          activeOpacity={1}
          onPress={() => {
            folderNameRef.current?.blur();
            folderDescriptionRef.current?.blur();
            handleModalClose();
          }}
        >
          <TouchableOpacity 
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Create New Folder
            </Text>
            
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Folder Name</Text>
              <TextInput
                ref={folderNameRef}
                defaultValue=""
                onChangeText={(text) => {
                  folderNameRefValue.current = text;
                }}
                placeholder="Enter folder name"
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                returnKeyType="next"
                onSubmitEditing={() => {
                  folderDescriptionRef.current?.focus();
                }}
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2">Description (Optional)</Text>
              <TextInput
                ref={folderDescriptionRef}
                defaultValue=""
                onChangeText={(text) => {
                  folderDescriptionRefValue.current = text;
                }}
                placeholder="Enter folder description"
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={() => {
                  folderDescriptionRef.current?.blur();
                }}
              />
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => {
                  folderNameRef.current?.blur();
                  folderDescriptionRef.current?.blur();
                  handleModalClose();
                }}
                className="flex-1 bg-gray-200 py-3 rounded-xl items-center"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  folderNameRef.current?.blur();
                  folderDescriptionRef.current?.blur();
                  console.log('Folder Name:', folderNameRefValue.current);
                  console.log('Folder Description:', folderDescriptionRefValue.current);
                  await new Promise((res) => setTimeout(res, 100));
                  await createNewFolder();
                }}
                className="flex-1 bg-green-500 py-3 rounded-xl items-center ml-3"
              >
                <Text className="text-white font-medium">Create</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};



const loadStudentData = async (userId: string) => {
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      *,
      online_instructor:online_instructor_id(name),
      theory_instructor:theory_instructor_id(name),
      in_person_instructor:in_person_id(name)
      `
    )
    .eq("user_id", userId)
    .single();

  if (error) {
    Alert.alert("Error loading student data", error.message);
    return;
  }

  setCurrentUser({ id: userId, role: "student" });
  setStudentProfile(data);
  
  loadStudentSessionData(data.id);
};

const loadInstructorData = async (userId: string) => {
  const { data: instructorData, error } = await supabase
    .from("instructors")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    Alert.alert("Error loading instructor data", error.message);
    return;
  }

  setCurrentUser({ id: instructorData.id, role: "instructor" });

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("*")
    .or(
      `online_instructor_id.eq.${instructorData.id},theory_instructor_id.eq.${instructorData.id},in_person_id.eq.${instructorData.id}`
    );

  if (!studentsError) {
    setTodaySessions(students || []);
  }
};
  // دالة لجلب الفولدرات من Supabase
  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Error", "Failed to fetch folders: " + error.message);
      return;
    }

    if (data) {
      setAdminFiles(data);
      console.log("📂 fetched folders data:", data);
    }
  };

  // جلب الفولدرات مرة واحدة عند تحميل المكون
  useEffect(() => {
    fetchFolders();
  }, []);

  // متابعة تغير adminFiles وطباعة القيمة الجديدة
    // useEffect لمراقبة تحديث adminFiles وطباعة القيمة الجديدة
  useEffect(() => {
    console.log('Admin files updated:', adminFiles);
    
    // هنا ممكن تعمل أي حاجة تانية لما adminFiles يتغير
  }, [adminFiles]);



  // Add this function to load student session data
  const loadStudentSessionData = async (studentIdParam?: string) => {
    try {
      const studentId = studentIdParam || currentUser?.id;

      if (!studentId) {
        console.error("Student ID not found");
        return;
      }

      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("*")
        .eq("student_id", studentId);

      if (feedbackError) {
        console.error("Error loading feedback:", feedbackError);
      } else {
        const inPersonMax = feedbackData
          .filter((item) => item.session_type === "In-Person")
          .reduce((max, item) => Math.max(max, item.session_number || 0), 0);

        const onlineMax = feedbackData
          .filter((item) => item.session_type === "Online")
          .reduce((max, item) => Math.max(max, item.session_number || 0), 0);

        const theoryMax = feedbackData
          .filter((item) => item.session_type === "Theory")
          .reduce((max, item) => Math.max(max, item.session_number || 0), 0);

        const progress = {
          in_person_completed: inPersonMax,
          online_instrument_completed: onlineMax,
          theory_completed: theoryMax,
          total_sessions: inPersonMax + onlineMax + theoryMax,
          month: new Date().toLocaleDateString("en-US", { month: "long" }),
          year: new Date().getFullYear(),
        };

        setSessionProgress(progress);
      }
    } catch (error) {
      console.error("Error loading student data:", error);
    }
  };

  const handleGiveFeedback = (student: Student): void => {
    setSelectedStudent(student);
    setCurrentScreen("feedback");
  };

  const uploadFeedbackFile = async (
    file: any,
    studentId: string
  ): Promise<string | null> => {
    if (!file) return null;

    try {
      const filePath = `${studentId}/${Date.now()}-${file.name}`;

      const fileUri = file.uri;

      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error("File does not exist");
      }

      // اقرأ الملف كـ base64
      const base64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Supabase لا تقبل base64 مباشر للأسف هنا، فنستخدم FormData
      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: file.name,
        type: file.mimeType || "application/pdf",
      } as any);

      // ✳️ استخدم fetch على Signed URL (لو عندك)
      // ❌ أو بدل كده نستخدم طريقة مباشرة مع Supabase.upload ولكن عبر RNFS أو مكتبة مثل `supabase-storage-upload`

      const { error } = await supabase.storage
        .from("feedback-files")
        .upload(filePath, fileUri, {
          contentType: file.mimeType || "application/pdf",
          upsert: false,
        });

      if (error) {
        console.error("Upload Error:", error.message);
        Alert.alert("Upload Error", error.message);
        return null;
      }

      const publicUrl = `https://cgzypavgkpiklnzvjoxt.supabase.co/storage/v1/object/public/feedback-files/${filePath}`;
      return publicUrl;
    } catch (err: any) {
      console.error("Upload Exception:", err);
      Alert.alert("Upload Error", err.message || "Unknown error");
      return null;
    }
  };

  const getInstructorName = async (instructorId: string) => {
    const { data, error } = await supabase
      .from("instructors")
      .select("name") // العمود اللي فيه اسم المدرس
      .eq("user_id", instructorId)
      .single(); // عشان ترجع صف واحد فقط

    if (error) {
      console.error("Error fetching instructor name:", error);
      return "";
    }

    return data.name;
  };

  // 5. Add these handler functions:

  const handleEditStudentPress = (student: any) => {
    setEditStudentForm({
      name: student.name,
      instrument: student.instrument,
      student_email: student.student_email,
      father_email: student.father_email,
      mother_email: student.mother_email,
      in_person_id: student.in_person_id || "",
      in_person_name: student.in_person_name || "",
      theory_instructor_id: student.theory_instructor_id || "",
      theory_instructor_name: student.theory_instructor_name || "",
      online_instructor_id: student.online_instructor_id || "",
      online_instructor_name: student.online_instructor_name || "",
      instructor_id: student.instructor_id || "",
      created_at: student.created_at,
      mother_phone: student.mother_phone,
      Student_Phone_Number: student.Student_Phone_Number || "",
      father_phone: student.father_phone,
      password: student.password,
    });
    setEditingStudentId(student.id);
    setCurrentScreen("edit-student");
  };

  const handleEditInstructorPress = (instructor: any) => {
    setEditInstructorForm({
      name: instructor.name,
      role: instructor.role,
      email: instructor.email,
      phone: instructor.phone,
      password: instructor.password,
      role2:instructor.role2,
      type: instructor.type,
    });
    setEditingInstructorId(instructor.id);
    setCurrentScreen("edit-instructor");
  };

  const handleEditStudent = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("students")
        .update({
          name: editStudentForm.name,
          instrument: editStudentForm.instrument,
          student_email: editStudentForm.student_email,
          father_email: editStudentForm.father_email,
          mother_email: editStudentForm.mother_email,
          in_person_id: editStudentForm.in_person_id || null,
          in_person_name: editStudentForm.in_person_name || null,
          theory_instructor_id: editStudentForm.theory_instructor_id || null,
          theory_instructor_name:
            editStudentForm.theory_instructor_name || null,
          online_instructor_id: editStudentForm.online_instructor_id || null,
          online_instructor_name:
            editStudentForm.online_instructor_name || null,
          mother_phone: editStudentForm.mother_phone,
          father_phone: editStudentForm.father_phone,
          password: editStudentForm.password,
        })
        .eq("id", editingStudentId);

      if (error) {
        console.error("Error updating student:", error);
        alert("Error updating student");
        return;
      }

      alert("Student updated successfully!");
      
      setCurrentScreen("admin-students");

      // Reset form
      setEditStudentForm({
        name: "",
        instrument: "",
        student_email: "",
        father_email: "",
        mother_email: "",
        in_person_id: "",
        in_person_name: "",
        theory_instructor_id: "",
        theory_instructor_name: "",
        online_instructor_id: "",
        online_instructor_name: "",
        instructor_id: "",
        created_at: "",
        mother_phone: "",
        Student_Phone_Number: "",
        father_phone: "",
        password: "",
      });
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
      

    }
  };
useEffect(() => {
  loadData();
  loadAdminStudents();
}, []);
  const handleEditInstructor = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from("instructors")
        .update({
          name: editInstructorForm.name,
          role: editInstructorForm.role,
          email: editInstructorForm.email,
          role2:editInstructorForm.role2,
          password: editInstructorForm.password,
          type: editInstructorForm.type,
        })
        .eq("id", editingInstructorId);

      if (error) {
        console.error("Error updating instructor:", error);
        alert("Error updating instructor");
        return;
      }

      alert("Instructor updated successfully!");
      setCurrentScreen("admin-instructors");

      // Reset form
      setEditInstructorForm({
        name: "",
        role: "",
        email: "",
        role2:"",
        password: "",
        phone:'',
        type: "",
      });
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFeedback = async (): Promise<void> => {
    if (
      !feedbackForm.comment ||
      !feedbackForm.homework ||
      feedbackForm.rating === 0
    ) {
      Alert.alert("Error", "Please fill in all required fields");

      return;
    }

    if (!selectedStudent) {
      Alert.alert("Error", "No student selected");
      return;
    }

    setLoading(true); // لو عندك سبينر للتحميل

    let uploadedFilePath = null;

    // ارفع الملف لو فيه ملف مرفق
    if (feedbackForm.uploadedFile) {
      uploadedFilePath = await uploadFeedbackFile(
        feedbackForm.uploadedFile,
        selectedStudent.id
      );

      if (!uploadedFilePath) {
        setLoading(false);

        Alert.alert("Upload Error", "Failed to upload file");
        return;
      }
    }

    const { error } = await supabase.from("feedback").insert([
      {
        student_id: selectedStudent.id,
        comment: feedbackForm.comment,
        homework_rating: feedbackForm.rating,
        sheet: uploadedFilePath, // مسار الملف بعد الرفع
        HW_comments: feedbackForm.homework,
        instructor_id: currentUser?.id,
        session_type: feedbackForm.session_type,
        feedback: feedbackForm.feedback,
        session_number: feedbackForm.session_number,
      },
    ]);

    setLoading(false);

    if (error) {
      console.log("Errorr:", error);

      return;
    }

    setCurrentScreen("confirmation");

    setTimeout(() => {
      setCurrentScreen("dashboard");
      setFeedbackForm({
        comment: 0,
        rating: 0,
        homework: `* C major and G major scales - similar motion, contrary-motion, 2 octaves.
* Chromatic scale on C - hands together. (Control fingering, practice slow, control position of your hand).
* ⁠Broken chords C major - play both hands 
* ⁠Believer - confidently two hands together
* ⁠Sparkling Splashes - whole piece hands together. By heart. 1 page - pay attention about all indications (staccato, legato, dynamics). 2 page - work with text more, play slowly, pay attention oboit pauses.`,
        feedback: "",
        uploadedFile: null,
        check: "",
        instructor_id: "",
        instructor_name: "",
        session_type: "",
        session_number: "",
      });
    }, 2000);
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        if (!selectedStudent) {
          Alert.alert("Error", "No student selected");
          return;
        }

        const uploadedUrl = await uploadFeedbackFile(file, selectedStudent.id);

        if (uploadedUrl) {
          setFeedbackForm((prev) => ({
            ...prev,
            uploadedFile: { ...file, url: uploadedUrl },
          }));
        }
      }
    } catch (err) {
      Alert.alert("File Upload Failed", "Try again later.");
    }
  };

  const StarRating: React.FC<StarRatingProps> = ({
    rating,
    onRatingChange,
  }) => {
    const [starAnims] = useState(
      [1, 2, 3, 4, 5].map(() => new Animated.Value(1))
    );

    const animateStar = (index: number) => {
      Animated.sequence([
        Animated.timing(starAnims[index], {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(starAnims[index], {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    };

    return (
      <View className="flex-row justify-center items-center py-4 space-x-1">
        {[1, 2, 3, 4, 5].map((star, index) => (
          <Animated.View
            key={star}
            style={{
              transform: [{ scale: starAnims[index] }],
            }}
          >
            <TouchableOpacity
              onPress={() => {
                animateStar(index);
                onRatingChange(star);
              }}
              className="p-1"
              activeOpacity={0.8}
            >
              <Ionicons
                name={star <= rating ? "star" : "star-outline"}
                size={32}
                color={star <= rating ? "#FBBF24" : "#D1D5DB"}
              />
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    );
  };
const loadAdminStudentFeedbacks = async (studentId: string) => {
  try {
    setLoading(true);

    const { data: feedbackData, error: feedbackError } = await supabase
      .from("feedback")
      .select("*") // ← بيجيب كل الأعمدة
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (feedbackError) {
      console.error("Error loading student feedbacks:", feedbackError);
      Alert.alert("Error", "Could not load student feedback history");
      setLoading(false);
      return;
    }

    setAdminStudentFeedbacks(feedbackData || []);
    setLoading(false);
  } catch (error) {
    console.error("Error loading student feedbacks:", error);
    Alert.alert("Error", "An unexpected error occurred");
    setLoading(false);
  }
};

// 3. Add function to handle student press
const handleAdminStudentPress = (student: AdminStudent) => {
  setSelectedAdminStudent(student);
  setCurrentScreen("admin-student-history");
  loadAdminStudentFeedbacks(student.id);
};

// 3. Add function to handle student press
const handleInstructorStudentPress = (student: StudentProfile) => {
  setSelectedInstrucotrStudent(student);
  setCurrentScreen("instructor-student-history");
  loadAdminStudentFeedbacks(student.id);
};

  const loadData = async () => {
    const { data: instructorsData, error: instructorsError } = await supabase
      .from("instructors")
      .select("*")
      .order("created_at", { ascending: false });

    if (instructorsError) {
      return;
    }
    setInstructors(instructorsData);

    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (studentsError) {
      return;
    }
    setAdminStudents(studentsData);
  };

  const loadAdminStudents = async (): Promise<void> => {
    const { data, error } = await supabase
      .from("students")
      .select(
        `
      *,
      instructors!inner(name, email)
    `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return;
    }

    setAdminStudents(data || []);
  };

  const fadeIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAddStudent = async (): Promise<void> => {
  // Use studentForm which is now updated with collected data before this function is called
  if (
    !studentForm.name ||
    !studentForm.student_email ||
    !studentForm.instrument ||
    !studentForm.mother_phone ||
    !studentForm.theory_instructor_id ||
    !studentForm.in_person_id ||
    !studentForm.password
  ) {
    Alert.alert("Error", "Please fill in all fields including password");
    return;
  }

  setLoading(true);

  try {
    const supabaseAdmin = createClient(
      "https://cgzypavgkpiklnzvjoxt.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnenlwYXZna3Bpa2xuenZqb3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE2MDU1OCwiZXhwIjoyMDY3NzM2NTU4fQ.qg4LJ0cjf2iaYbFmeNIXYMKmBqG923F1Bp-Y8tBwSVA" // service role key
    );

    const { data: authData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: studentForm.student_email,
        password: studentForm.password,
        email_confirm: true,
      });

    if (createError) {
      console.error("Auth creation error:", createError);
      Alert.alert("Error", "Failed to create user account");
      return;
    }

    if (!createError) {
      const { error: updateError } = await supabaseAdmin
        .from("auth.users")
        .update({ email_confirmed_at: new Date().toISOString() })
        .eq("id", authData.user?.id);

      if (updateError) {
        console.error("Failed to mark email as confirmed:", updateError);
      }
    }

    // Add student to database using supabaseAdmin
    const { error } = await supabaseAdmin.from("students").insert([
      {
        name: studentForm.name,
        instrument: studentForm.instrument,
        student_email: studentForm.student_email,
        father_email: studentForm.father_email,
        father_phone: studentForm.father_phone,
        mother_email: studentForm.mother_email,
        mother_phone: studentForm.mother_phone,
        in_person_id: studentForm.in_person_id,
        in_person_name: studentForm.in_person_name,
        theory_instructor_id: studentForm.theory_instructor_id,
        student_phone_number: studentForm.Student_Phone_Number,
        theory_instructor_name: studentForm.theory_instructor_name,
        online_instructor_id: studentForm.online_instructor_id,
        online_instructor_name: studentForm.online_instructor_name,
        password: studentForm.password,
        user_id: authData.user?.id,
        avatar: studentForm.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase(),
        color: [
          "#3B82F6",
          "#10B981",
          "#F59E0B",
          "#8B5CF6",
          "#EF4444",
          "#0EA5E9",
          "#22C55E",
          "#EAB308",
          "#6366F1",
          "#F43F5E",
        ][Math.floor(Math.random() * 10)], // Fixed to use 10 colors instead of 5
      },
    ]);

    if (error) {
      console.log("Database Error:", error);
      Alert.alert("Error", error.message);
      return;
    }

    Alert.alert("Success", "Student added successfully");
    
    // Reset studentForm to empty state (this will be done by resetForm() in the component)
    setStudentForm({
      name: "",
      instrument: "",
      student_email: "",
      father_email: "",
      mother_email: "",
      in_person_id: "",
      in_person_name: "",
      theory_instructor_id: "",
      theory_instructor_name: "",
      online_instructor_id: "",
      online_instructor_name: "",
      instructor_id: "",
      created_at: "",
      mother_phone: "",
      Student_Phone_Number: "",
      father_phone: "",
      password: "",
    });
    
    setCurrentScreen("admin-students");
    loadAdminStudents();

  } catch (error) {
    console.error('Error adding student:', error);
    Alert.alert("Error", "Failed to add student. Please try again.");
  } finally {
    setLoading(false);
  }
};



  const toggleExpand = (sessionId: string) => {
  setExpandedSessionIds(prev => {
    const newSet = new Set(prev);
    if (newSet.has(sessionId)) {
      newSet.delete(sessionId);
    } else {
      newSet.add(sessionId);
    }
    return newSet;
  });
};


    const handleAddInstructor = async (): Promise<void> => {
      if (
        !instructorForm.name ||
        !instructorForm.email ||
        !instructorForm.password ||
        !instructorForm.phone ||
        !instructorForm.role
      ) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      setLoading(true);

      const supabaseAdmin = createClient(
        "https://cgzypavgkpiklnzvjoxt.supabase.co",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnenlwYXZna3Bpa2xuenZqb3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE2MDU1OCwiZXhwIjoyMDY3NzM2NTU4fQ.qg4LJ0cjf2iaYbFmeNIXYMKmBqG923F1Bp-Y8tBwSVA" // تأكد إن دي service role key صح
      );

      // Create auth user first
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: instructorForm.email,
          password: instructorForm.password,
          email_confirm: true,
        });

      if (authError) {
        setLoading(false);

        return;
      }

      // Add instructor to database using supabaseAdmin (مش supabase العادي)
      const { error } = await supabaseAdmin.from("instructors").insert([
        {
          name: instructorForm.name,
          role: instructorForm.role,
          email: instructorForm.email,
          user_id: authData.user?.id,
          phone: instructorForm.phone,
          role2:instructorForm.role2,
          password: instructorForm.password,
          type: instructorForm.type,
          avatar: instructorForm.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase(),
          color: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"][
            Math.floor(Math.random() * 5)
          ],
        },
      ]);

      setLoading(false);

      if (error) {
        console.log("Error:", error);

        return;
      }

      Alert.alert("Success", "Instructor added successfully");
      setInstructorForm({
        name: "",
        phone:'',
        role: "",
        email: "",
        password: "",
        type: "",
        role2:""
      });
      setCurrentScreen("admin-instructors");
      loadData();
    };

    // 4. Replace the LoginScreen component with this enhanced version
    const LoginScreen: React.FC = () => {
      const [temp, setTemp] = React.useState<{
        field: "Email" | "Password" | "";
        value: string;
      }>({ field: "", value: "" });

const handleEndEditing = async (): Promise<void> => {
  return new Promise((resolve) => {
    if (
      temp.field &&
      temp.value !==
        loginForm[temp.field.toLowerCase() as "email" | "password"]
    ) {
      setLoginForm((prev) => {
        const updated = {
          ...prev,
          [temp.field.toLowerCase()]: temp.value,
          check: temp.field,
        };
        // نستخدم setTimeout عشان نضمن إن resolve يتم بعد التحديث
        setTimeout(resolve, 0);
        return updated;
      });
      setTemp({ field: "", value: "" });
    } else {
      setTemp({ field: "", value: "" });
      resolve();
    }
  });
};

const updateLoginForm = (field: "email" | "password", value: string) => {
  return new Promise<void>((resolve) => {
    setLoginForm((prev) => {
      const updated = {
        ...prev,
        [field]: value,
        check: field === "email" ? "Email" : "Password",
      };
      setTimeout(resolve, 0); // 👈 نضمن إن التحديث خلص قبل نكمل
      return updated;
    });
  });
};

// Function to check if all required fields are filled
const isFormValid = () => {
  return loginForm.email.trim() !== "" && loginForm.password.trim() !== "";
};


const screenHeight = Dimensions.get("window").height;
const navigation = useNavigation();

useLayoutEffect(() => {
  navigation.setOptions({ headerShown: false });
  fadeIn();
}, [navigation]);

return ( 
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
  >
    <ScrollView keyboardShouldPersistTaps="handled">
      <SafeAreaView className="flex-1 bg-blue-50">
        <StatusBar barStyle="dark-content" backgroundColor="#EFF6FF" />
        <LinearGradient
          colors={["#EFF6FF", "#DBEAFE"]}
          className="flex-1 bg-blue-50 justify-center"
          style={{ height: screenHeight }}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            }}
          >
            {/* Header */}
            <View className="items-center mb-8">
              <Animated.View
                className="w-20 h-20 bg-white rounded-full shadow-lg items-center justify-center mb-4"
                style={{
                  transform: [{ scale: scaleAnim }],
                }}
              >
                <Ionicons name="musical-notes" size={40} color="#3B82F6" />
              </Animated.View>
              <Text className="text-2xl font-bold text-gray-800 mb-2">
                Tchaikovsky School
              </Text>
              <Text className="text-gray-600">Your Passion, Your Path, Your Platform.</Text>
            </View>

            {/* Login Form */}
            <Animated.View
              className="bg-white rounded-2xl shadow-lg p-6 mb-6"
              style={{
                transform: [{ translateY: slideAnim }],
              }}
            >
              <View className="space-y-4">
                {/* Email Input */}
                <View className="relative mb-3">
                  <View className="absolute left-3 top-3 z-10">
                    <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                  </View>
                  <TextInput
                    placeholder="Email"
                    value={
                      temp.field === "Email" ? temp.value : loginForm.email
                    }
                    onFocus={() =>
                      setTemp({ field: "Email", value: loginForm.email })
                    }
                    onChangeText={(text) =>
                      setTemp({ field: "Email", value: text })
                    }
                    onEndEditing={handleEndEditing}
                    placeholderTextColor="#999"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 focus:shadow-sm"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Password Input */}
                <View className="relative">
                  <View className="absolute left-3 top-3 z-10">
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#9CA3AF"
                    />
                  </View>
                  <TextInput
                    placeholder="Password"
                    value={
                      temp.field === "Password"
                        ? temp.value
                        : loginForm.password
                    }
                    onFocus={() =>
                      setTemp({ field: "Password", value: loginForm.password })
                    }
                    onChangeText={(text) =>
                      setTemp({ field: "Password", value: text })
                    }
                    placeholderTextColor="#999"
                    onEndEditing={handleEndEditing}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 focus:shadow-sm"
                    secureTextEntry
                    submitBehavior="blurAndSubmit"
                  />
                </View>
              </View>
              {/* ✅ CheckBox */}
              <View className="flex-row items-center mt-3">
                <Switch 
                  value={keepLoggedIn}
                  onValueChange={(value) => {
                    // لو المستخدم واقف على Password ولسه ما خلصش كتابة
                    if (temp.field === "Password") {
                      const fieldKey = "password";
                      if (temp.value !== loginForm[fieldKey]) {
                        setLoginForm((prev) => ({
                          ...prev,
                          [fieldKey]: temp.value,
                          check: "Password",
                        }));
                      }
                      setTemp({ field: "", value: "" }); // reset temp manually
                    }
                    
                    setKeepLoggedIn(value);
                  }}
                />
                <Text className="ml-2 text-gray-600">Keep me logged in</Text>
              </View>
            </Animated.View>

            {/* Login Button */}
            <Animated.View
              style={{ transform: [{ scale: buttonScale }] }}
              className="space-y-4"
            >
              <TouchableOpacity
                style={{ 
                  marginTop: 10,
                  opacity: (!isFormValid() || loading) ? 0.5 : 1 
                }}
                onPress={async () => {
                  if (temp.field) {
                    const fieldKey = temp.field.toLowerCase() as "email" | "password";
                    if (temp.value !== loginForm[fieldKey]) {
                      await updateLoginForm(fieldKey, temp.value);
                      setTemp({ field: "", value: "" });
                    }
                  }

                  await animateButton();
                  console.log(loginForm)
                  console.log(temp)
                  handleEndEditing()
                  await handleLogin();
                }}
                className="w-full bg-blue-500 py-4 rounded-xl shadow-lg active:bg-blue-600"
                disabled={!isFormValid() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center text-lg">
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    </ScrollView>
  </KeyboardAvoidingView>
    );
  };

  // 5. Enhanced DashboardScreen with staggered animations
const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionAnims] = useState(
    todaySessions.map(() => new Animated.Value(0))
  );

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Filter students based on search query
  const filteredSessions = todaySessions.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="bg-white shadow-sm">
        <View className="px-4 py-6">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-2xl font-bold text-gray-800">
                Students
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                handleLogout()
                setIsAdmin(false);
              }}
              className="w-10 h-10 bg-red-500 rounded-full items-center justify-center"
            >
              <Ionicons name="log-out-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              placeholder="Search students by name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-800"
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                className="ml-2"
              >
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Sessions List */}
      <ScrollView className="flex-1 px-4 py-4">
        <View className="space-y-3">
          {filteredSessions.length > 0 ? (
            filteredSessions.map((student, index) => (
              <View key={student.id} className="mb-4">
                <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Main Card Content */}
                  <TouchableOpacity
                    onPress={() => handleInstructorStudentPress(student)}
                    className="active:opacity-70"
                    activeOpacity={0.95}
                  >
                    <View className="p-4">
                      {/* Header Row */}
                      <View className="flex-row items-center space-x-4">
                        {/* Enhanced Avatar */}
                        <View className="relative">
                          <View
                            className="w-14 h-14 rounded-full items-center justify-center shadow-sm"
                            style={{ backgroundColor: student.color }}
                          >
                            <Text className="text-white font-bold text-lg">
                              {student.avatar}
                            </Text>
                          </View>
                          {/* Online indicator (optional) */}
                          <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                        </View>

                        {/* Student Info */}
                        <View className="flex-1 ms-2" >
                          <Text className="font-bold text-gray-900 text-lg mb-1">
                            {student.name}
                          </Text>
                          <View className="flex-row items-center">
                            <View className="bg-gray-100 px-2 py-1 rounded-lg">
                              <Text className="text-sm text-gray-700 font-medium">
                                {student.instrument}
                              </Text>
                            </View>
                          </View>
                          {/* Additional info row (optional) */}
                         
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Action Buttons Section */}
                  <View className="px-4 pb-4">
                    <View className="flex-row space-x-3 gap-4">
                      {/* Add Feedback Button */}
                      <TouchableOpacity 
                        onPress={() => handleGiveFeedback(student)}
                        className="flex-1 bg-blue-500 rounded-xl py-3 px-4 shadow-sm active:opacity-80"
                        activeOpacity={0.8}
                      >
                        <View className="flex-row items-center justify-center space-x-2">
                          <Ionicons name="chatbubble-outline" size={18} color="white" />
                          <Text className="text-white font-semibold text-sm">
                            Add Feedback
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* View History Button */}
                      <TouchableOpacity 
                        onPress={() => handleInstructorStudentPress(student)}
                        className="flex-1 bg-gray-100 rounded-xl py-3 px-4 border border-gray-200 active:opacity-80"
                        activeOpacity={0.8}
                      >
                        <View className="flex-row items-center justify-center space-x-2">
                          <Ionicons name="time-outline" size={18} color="#6B7280" />
                          <Text className="text-gray-700 font-semibold text-sm">
                            View History
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Quick Stats Bar (Optional Enhancement) */}
                  <View className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center space-x-4">
                        
                      </View>
                      
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-2xl shadow-sm p-8 mt-3 items-center">
              <Ionicons name="search" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 text-lg font-medium mt-4">
                No students found
              </Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                {searchQuery 
                  ? `No students match "${searchQuery}"`
                  : "No students available"
                }
              </Text>
            </View>
          )}          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
  // 1. Add these new screens to your main component

  const EditStudentScreen: React.FC = () => {
    const navigation = useNavigation();

    useLayoutEffect(() => {
      navigation.setOptions({ headerShown: false });
    }, [navigation]);

    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

        {/* Header */}
        <View className="bg-white shadow-sm">
          <View className="px-4 py-6">
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity
                onPress={() => setCurrentScreen("admin-students")}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Ionicons name="chevron-back" size={20} color="#6B7280" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-800">
                Edit Student
              </Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          <AdminStudentForm
            studentForm={editStudentForm}
            setStudentForm={setEditStudentForm}
            instructors={instructors}
            handleAddStudent={handleEditStudent}
            loadData={loadData}
            loading={loading}
            isEdit={true}
            studentId={editingStudentId}
            setLoading={setLoading}
            setCurrentScreen={setCurrentScreen}
            loadAdminStudents={loadAdminStudents}
          />
        </ScrollView>
      </SafeAreaView>
    );
  };

  const EditInstructorScreen: React.FC = () => {
    const navigation = useNavigation();

    useLayoutEffect(() => {
      navigation.setOptions({ headerShown: false });
    }, [navigation]);

    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

        {/* Header */}
        <View className="bg-white shadow-sm">
          <View className="px-4 py-6">
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity
                onPress={() => setCurrentScreen("admin-instructors")}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Ionicons name="chevron-back" size={20} color="#6B7280" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-800">
                Edit Instructor
              </Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          <AdminAddInstructorForm
            instructorForm={editInstructorForm}
            setInstructorForm={setEditInstructorForm}
            loading={loading}
setLoading={setLoading}
instructorId= {editingInstructorId}
            setCurrentScreen={setCurrentScreen}
            loadAdminInstructors={loadData}
                        isEdit={true}

          />
        </ScrollView>
      </SafeAreaView>
    );
  };

const AdminStudentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Filter students based on search query
  const filteredStudents = adminStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="bg-white shadow-sm">
        <View className="px-4 py-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity
                onPress={() => setCurrentScreen("admin")}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Ionicons name="chevron-back" size={20} color="#6B7280" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-800">
                Students
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setCurrentScreen("add-student")}
              className="bg-blue-500 px-4 py-2 rounded-xl"
            >
              <Text className="text-white font-medium">Add Student</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              placeholder="Search students by name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-800"
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                className="ml-2"
              >
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        <View className="space-y-3">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <View
                key={student.id}
                className="bg-white rounded-2xl shadow-sm p-4 mb-3"
              >
                {/* Main Student Card - Clickable */}
                <TouchableOpacity
                  onPress={() => handleAdminStudentPress(student)}
                  className="active:opacity-70"
                  activeOpacity={0.7}
                >
                  {/* Header Row */}
                  <View className="flex-row items-center justify-between">
                    {/* Avatar + Info */}
                    <View className="flex-row items-center space-x-3 flex-1">
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center"
                        style={{ backgroundColor: student.color }}
                      >
                        <Text className="text-white font-semibold text-sm">
                          {student.avatar}
                        </Text>
                      </View>
                      <View className="flex-1 ms-3">
                        <Text className="font-semibold text-gray-800">
                          {student.name}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          {student.instrument}
                        </Text>
                        <Text className="text-xs text-blue-600 font-medium mt-1">
                          Tap to view feedback history
                        </Text>
                      </View>
                    </View>

                    {/* View History Icon */}
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>

                  {/* Emails Section */}
                  <View className="mt-3 ml-16">
                    {student.student_email && (
                      <Text className="text-xs text-gray-500">
                        Main Email: {student.student_email}
                      </Text>
                    )}
                    
                    {student.father_phone && (
                      <Text className="text-xs text-gray-500">
                        Father Phone: {student.father_phone}
                      </Text>
                    )}
                  
                    {student.mother_phone && (
                      <Text className="text-xs text-gray-500">
                        Mother Phone: {student.mother_phone}
                      </Text>
                    )}
                    {student.in_person_name && (
                      <Text className="text-xs text-gray-500">
                        Mother Phone: {student.in_person_name}
                      </Text>
                    )}
                    {student.online_instructor_name && (
                      <Text className="text-xs text-gray-500">
                        Mother Phone: {student.online_instructor_name}
                      </Text>
                    )}
                    {student.online_instructor_name && (
                      <Text className="text-xs text-gray-500">
                        Mother Phone: {student.online_instructor_name}
                      </Text>
                    )}
                    {student.password && (
                      <Text className="text-xs text-gray-500">
                        Password: {student.password}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Action Buttons - Separate from main touch area */}
                <View className="flex-row items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-100">
                  <TouchableOpacity
                    onPress={() => handleEditStudentPress(student)}
                    className="p-2 bg-blue-50 rounded-lg"
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color="#3B82F6"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(student.id, "student")}
                    className="p-2 bg-red-50 rounded-lg"
                  >
                    <Ionicons name="trash" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-2xl shadow-sm p-8 mt-3 items-center">
              <Ionicons name="search" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 text-lg font-medium mt-4">
                No students found
              </Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                {searchQuery 
                  ? `No students match "${searchQuery}"`
                  : "No students available"
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
// FileSelector component (inline for now, you can move to separate file later)
const FileSelector: React.FC<{
  selectedFile: FileItem | null;
  onFileSelect: (file: FileItem | null) => void;
  studentId?: number;
}> = ({ selectedFile, onFileSelect, studentId }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Function to fetch files from Supabase
  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      // Build query - adjust table name and filtering as needed
      let query = supabase.from('folders').select('files');
      
      // Optional: Add filtering by student ID if needed
      // if (studentId) {
      //   query = query.eq('student_id', studentId);
      // }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching files:', error);
        Alert.alert('Error', 'Failed to load files');
        return;
      }

      // Extract files from all rows and flatten the array
      const allFiles: FileItem[] = [];
      data?.forEach((row) => {
        if (row.files && Array.isArray(row.files)) {
          allFiles.push(...row.files);
        }
      });

      // Sort files by upload date (newest first)
      allFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      setFiles(allFiles);
    } catch (error) {
      console.error('Error fetching files:', error);
      Alert.alert('Error', 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  // Fetch files when modal opens
  useEffect(() => {
    if (modalVisible) {
      fetchFiles();
    }
  }, [modalVisible]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return 'document-text';
    if (type.includes('image')) return 'image';
    if (type.includes('audio')) return 'musical-notes';
    return 'document';
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render file item
  const renderFileItem = ({ item }: { item: FileItem }) => (
    <TouchableOpacity
      onPress={() => {
        onFileSelect(item);
        setModalVisible(false);
      }}
      className={`p-4 border-b border-gray-200 active:bg-gray-50 ${
        selectedFile?.id === item.id ? 'bg-blue-50 border-blue-200' : ''
      }`}
    >
      <View className="flex-row items-center space-x-3">
        <View className={`w-10 h-10 rounded-lg items-center justify-center ${
          selectedFile?.id === item.id ? 'bg-blue-100' : 'bg-gray-100'
        }`}>
          <Ionicons
            name={getFileIcon(item.type) as any}
            size={20}
            color={selectedFile?.id === item.id ? '#3B82F6' : '#6B7280'}
          />
        </View>
        
        <View className="flex-1">
          <Text 
            className={`font-medium text-sm ${
              selectedFile?.id === item.id ? 'text-blue-800' : 'text-gray-800'
            }`}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View className="flex-row items-center space-x-2 mt-1">
            <Text className="text-xs text-gray-500">
              {formatFileSize(item.size)}
            </Text>
            <Text className="text-xs text-gray-400">•</Text>
            <Text className="text-xs text-gray-500">
              {formatDate(item.uploadedAt)}
            </Text>
          </View>
          <Text className="text-xs text-gray-400 mt-1">
            By {item.uploadedBy}
          </Text>
        </View>

        {selectedFile?.id === item.id && (
          <Ionicons name="checkmark-circle" as any size={20} color="#3B82F6" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {/* File Selector Button */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center active:scale-95"
        activeOpacity={0.8}
      >
        <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-3">
          <Ionicons
            name={selectedFile ? "document-text" as any : "folder-open-outline" as any}
            size={24}
            color="#3B82F6"
          />
        </View>
        <Text className="text-sm text-gray-600 text-center">
          {selectedFile ? (
            <Text className="text-blue-600 font-medium">
              {selectedFile.name}
            </Text>
          ) : (
            "Tap to select from library"
          )}
        </Text>
        {selectedFile && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onFileSelect(null);
            }}
            className="mt-2 px-3 py-1 bg-red-100 rounded-full"
          >
            <Text className="text-xs text-red-600">Remove</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* File Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-white">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-800">
              Select File
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
            >
              <Ionicons name="close" as any size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Files List */}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="text-gray-600 mt-2">Loading files...</Text>
            </View>
          ) : files.length > 0 ? (
            <FlatList
              data={files}
              keyExtractor={(item) => item.id}
              renderItem={renderFileItem}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View className="flex-1 items-center justify-center p-8">
              <Ionicons name="folder-open-outline" as any size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-center mt-4">
                No files available
              </Text>
              <Text className="text-gray-400 text-center text-sm mt-2">
                Files will appear here once uploaded
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

// Updated FeedbackScreen with Supabase file selector
const FeedbackScreen: React.FC = () => {
  // Form refs to access values directly
  const sessionRatingRef = useRef<number>(0);
  const homeworkRatingRef = useRef<number>(0);
  const sessionNumberRef = useRef<string>("");
  const sessionTypeRef = useRef<string>("");
  const feedbackRef = useRef<TextInput>(null);
  const homeworkRef = useRef<TextInput>(null);
  
  // Change this to store the selected file from Supabase
  const selectedFileRef = useRef<FileItem | null>(null);

  // Text values stored in state since TextInput refs don't hold values reliably
  const [feedbackText, setFeedbackText] = useState("");
  const [homeworkText, setHomeworkText] = useState("* C major and G major scales - similar motion, contrary-motion, 2 octaves.\n* Chromatic scale on C - hands together. (Control fingering, practice slow, control position of your hand).\n* ⁠Broken chords C major - play both hands \n* ⁠Believer - confidently two hands together\n* ⁠Sparkling Splashes - whole piece hands together. By heart. 1 page - pay attention about all indications (staccato, legato, dynamics). 2 page - work with text more, play slowly, pay attention oboit pauses.");

  // Local state for UI updates only
  const [sessionRating, setSessionRating] = useState(0);
  const [homeworkRating, setHomeworkRating] = useState(0);
  const [sessionNumber, setSessionNumber] = useState("");
  const [sessionType, setSessionType] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const [formAnim] = useState(new Animated.Value(0));

  const blurAll = () => {
    feedbackRef.current?.blur();
    homeworkRef.current?.blur();
  };

  // Function to collect all form data
  const collectFormData = () => {
    return {
      comment: sessionRatingRef.current,
      rating: homeworkRatingRef.current,
      session_number: sessionNumberRef.current,
      session_type: sessionTypeRef.current,
      feedback: feedbackText,
      homework: homeworkText,
      selectedFile: selectedFileRef.current, // Use the selected file from Supabase
    };
  };

  // Function to reset form
  const resetForm = () => {
    // Reset refs
    sessionRatingRef.current = 0;
    homeworkRatingRef.current = 0;
    sessionNumberRef.current = "";
    sessionTypeRef.current = "";
    selectedFileRef.current = null;

    // Reset local state
    setSessionRating(0);
    setHomeworkRating(0);
    setSessionNumber("");
    setSessionType("");
    setSelectedFile(null);
    setFeedbackText("");
    setHomeworkText("* C major and G major scales - similar motion, contrary-motion, 2 octaves.\n* Chromatic scale on C - hands together. (Control fingering, practice slow, control position of your hand).\n* ⁠Broken chords C major - play both hands \n* ⁠Believer - confidently two hands together\n* ⁠Sparkling Splashes - whole piece hands together. By heart. 1 page - pay attention about all indications (staccato, legato, dynamics). 2 page - work with text more, play slowly, pay attention oboit pauses.");
  };

  // Handle file selection from Supabase
  const handleFileSelect = (file: FileItem | null) => {
    selectedFileRef.current = file;
    setSelectedFile(file);
  };

  const handleSubmitFeedback = async (): Promise<void> => {
    try {
      // Collect all form data
      const formData = collectFormData();
      
      console.log('Collected Form Data:', formData);
      
      // Validate required fields
      if (!formData.comment || !formData.homework || formData.rating === 0) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      if (!selectedStudent) {
        Alert.alert("Error", "No student selected");
        return;
      }

      setLoading(true);

      // Use the URL from the selected file directly (no need to upload)
      const fileUrl = formData.selectedFile ? formData.selectedFile.url : null;

      // Insert feedback data to Supabase
      const { error } = await supabase.from("feedback").insert([
        {
          student_id: selectedStudent.id,
          comment: formData.comment,
          homework_rating: formData.rating,
          sheet: fileUrl, // Use the URL from the selected file
          HW_comments: formData.homework,
          instructor_id: currentUser?.id,
          session_type: formData.session_type,
          feedback: formData.feedback,
          session_number: formData.session_number,
        },
      ]);

      if (error) {
        console.log("Supabase Error:", error);
        Alert.alert("Error", "Failed to submit feedback. Please try again.");
        return;
      }

      // Success - reset form
      resetForm();
      
      // Navigate to confirmation screen
      setCurrentScreen("confirmation");

      // After 2 seconds, go back to dashboard
      setTimeout(() => {
        setCurrentScreen("dashboard");
      }, 2000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });

    Animated.timing(formAnim, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [navigation]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="bg-white shadow-sm">
        <View className="px-4 py-6">
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity
              onPress={() => setCurrentScreen("dashboard")}
              className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center active:scale-95"
            >
              <Ionicons name="chevron-back" as any size={20} color="#6B7280" />
            </TouchableOpacity>
            <View className="ms-2">
              <Text className="text-xl font-bold text-gray-800">
                Session Feedback
              </Text>
              <Text className="text-gray-600 text-sm">
                {selectedStudent?.name}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView 
          className="flex-1 px-4 py-4"
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            className="space-y-4"
            style={{
              opacity: formAnim,
              transform: [
                {
                  translateY: formAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            }}
          >
            {/* Session Rating */}
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-3 text-center">
                Session Rating
              </Text>
              <StarRating
                rating={sessionRating}
                onRatingChange={(rating: number) => {
                  sessionRatingRef.current = rating;
                  setSessionRating(rating);
                }}
              />
            </View>

            {/* Homework Rating */}
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-3 text-center">
                Homework Rating
              </Text>
              <StarRating
                rating={homeworkRating}
                onRatingChange={(rating: number) => {
                  homeworkRatingRef.current = rating;
                  setHomeworkRating(rating);
                }}
              />
            </View>

            {/* Session Number */}
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Session Number
              </Text>
              <Picker
                selectedValue={sessionNumber}
                onValueChange={(itemValue) => {
                  sessionNumberRef.current = itemValue;
                  setSessionNumber(itemValue);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 12,
                  padding: 10,
                  color: "#333",
                  backgroundColor: "#fff",
                  marginVertical: 8,
                }}
              >
                <Picker.Item label="1/4" value="1" color="#000"/>
                <Picker.Item label="2/4" value="2" color="#000"/>
                <Picker.Item label="3/4" value="3" color="#000"/>
                <Picker.Item label="4/4" value="4" color="#000"/>
              </Picker>
            </View>

            {/* Session Type */}
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Session Type
              </Text>
              <Picker
                selectedValue={sessionType}
                onValueChange={(itemValue) => {
                  sessionTypeRef.current = itemValue;
                  setSessionType(itemValue);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 12,
                  padding: 10,
                  color: "#333",
                  backgroundColor: "#fff",
                  marginVertical: 8,
                }}
              >
                <Picker.Item label="Online" value="Online" color="#000"/>
                <Picker.Item label="In-Person" value="In-Person" color="#000" />
                <Picker.Item label="Theory" value="Theory" color="#000"/>
              </Picker>
            </View>

            {/* File Selection - Replace the old upload section */}
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Select Sheet Music/Materials
              </Text>
              <FileSelector
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                studentId={selectedStudent?.id ? Number(selectedStudent.id) : undefined}
              />
            </View>

            {/* Feedback */}
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Feedback
              </Text>
              <TextInput
                ref={feedbackRef}
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="What is your opinion about the student?"
                placeholderTextColor="#999"
                className="w-full p-3 border border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 focus:shadow-sm text-base"
                textAlignVertical="top"
              />
            </View>

            {/* Homework Task */}
            <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Homework Task
              </Text>
              <TextInput
                ref={homeworkRef}
                value={homeworkText}
                onChangeText={setHomeworkText}
                placeholder="What should the student practice this week?"
                placeholderTextColor="#999"
                className="w-full min-h-[160px] p-3 border border-gray-200 rounded-xl text-gray-800 focus:border-blue-500 focus:shadow-sm text-base"
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              disabled={loading}
              onPress={async () => {
                blurAll();
                await new Promise((res) => setTimeout(res, 100));
                await handleSubmitFeedback();
              }}
              className={`w-full py-4 rounded-xl shadow-lg mb-6 active:scale-95 ${
                loading ? "bg-gray-400" : "bg-blue-500 active:bg-blue-600"
              }`}
            >
              <Text className="text-white font-semibold text-center text-lg">
                {loading ? "Submitting..." : "Submit Feedback"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
const AdminStudentHistoryScreen: React.FC = () => {

const [onlineTheoryMeet, setOnlineTheoryMeet] = useState('');
const [onlinePracticeMeet, setOnlinePracticeMeet] = useState('');
const [inPersonLocation, setInPersonLocation] = useState('');
const [savingLinks, setSavingLinks] = useState(false);

// Replace the handleSaveMeetingLink function
const handleSaveLinks = async () => {
  if (!selectedAdminStudent?.id) {
    Alert.alert("Error", "No student selected");
    return;
  }

  // Check if at least one field is filled
  if (!onlineTheoryMeet && !onlinePracticeMeet && !inPersonLocation) {
    Alert.alert("Error", "Please fill at least one field");
    return;
  }

  setSavingLinks(true);

  // Update all feedbacks for this student
  const updateData: any = {};
  if (onlineTheoryMeet) updateData.Online_Theory_Meet = onlineTheoryMeet;
  if (onlinePracticeMeet) updateData.Online_Practice_Meet = onlinePracticeMeet;
  if (inPersonLocation) updateData.In_person_Location = inPersonLocation;

  const { error } = await supabase
    .from("feedback")
    .update(updateData)
    .eq("student_id", selectedAdminStudent.id);
console.log("Trying to update with:", updateData, "for student_id:", selectedAdminStudent.id);

  setSavingLinks(false);

  if (error) {
    Alert.alert("Error", "Failed to save information");
    console.error(error);
  } else {
    Alert.alert("Success", "Information saved successfully for all student sessions");
    // Clear the inputs
    setOnlineTheoryMeet('');
    setOnlinePracticeMeet('');
    setInPersonLocation('');
  }
};



  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionTypeColor = (sessionType: string) => {
    switch (sessionType) {
      case 'In-Person': return '#10B981';
      case 'Online': return '#3B82F6';
      case 'Theory': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={16}
            color={star <= rating ? "#FBBF24" : "#D1D5DB"}
          />
        ))}
      </View>
    );
  };
const [instructorNames, setInstructorNames] = useState<
      Record<string, string>
    >({});

    useEffect(() => {
      const fetchAllInstructorNames = async () => {
        const names = { ...instructorNames };

        for (const session of adminStudentFeedbacks) {
          const id = session.instructor_id;
          if (id && !names[id]) {
            const name = await getInstructorName(id);
            names[id] = name || "Unknown";
          }
        }

        setInstructorNames(names);
      };

      if (adminStudentFeedbacks.length > 0) {
        fetchAllInstructorNames();
      }
    }, [adminStudentFeedbacks]);
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View className="bg-white shadow-sm">
        <View className="px-4 py-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setCurrentScreen("admin-students")}
                className="mr-4 p-2 rounded-full bg-gray-100"
              >
                <Ionicons name="arrow-back" size={20} color="#374151" />
              </TouchableOpacity>
              <View>
                <Text className="text-xl font-bold text-gray-800">
                  Feedback History
                </Text>
                {selectedAdminStudent && (
                  <Text className="text-sm text-gray-600 mt-1">
                    {selectedAdminStudent.name} • {selectedAdminStudent.instrument}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
      <ScrollView>

        

{/* Session Information Input Section */}
<View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
  <Text className="text-lg font-semibold text-gray-800 mb-4">Session Information</Text>
  
  {/* Online Theory Meeting Link */}
  <View className="mb-4">
    <View className="flex-row items-center mb-2">
      <Ionicons name="videocam" size={16} color="#8B5CF6" />
      <Text className="text-sm font-medium text-gray-700 ml-2">Online Theory Meeting Link:</Text>
    </View>
    <TextInput
      value={onlineTheoryMeet}
      onChangeText={setOnlineTheoryMeet}
      placeholder="https://zoom.us/theory-session..."
      className="border border-purple-200 rounded-lg p-3 text-sm text-gray-800 bg-purple-50"
      placeholderTextColor="#9CA3AF"
    />
  </View>

  {/* Online Practice Meeting Link */}
  <View className="mb-4">
    <View className="flex-row items-center mb-2">
      <Ionicons name="musical-notes" size={16} color="#3B82F6" />
      <Text className="text-sm font-medium text-gray-700 ml-2">Online Practice Meeting Link:</Text>
    </View>
    <TextInput
      value={onlinePracticeMeet}
      onChangeText={setOnlinePracticeMeet}
      placeholder="https://zoom.us/practice-session..."
      className="border border-blue-200 rounded-lg p-3 text-sm text-gray-800 bg-blue-50"
      placeholderTextColor="#9CA3AF"
      />
  </View>

  {/* In-Person Location */}
  <View className="mb-4">
    <View className="flex-row items-center mb-2">
      <Ionicons name="location" size={16} color="#10B981" />
      <Text className="text-sm font-medium text-gray-700 ml-2">In-Person Location:</Text>
    </View>
    <TextInput
      value={inPersonLocation}
      onChangeText={setInPersonLocation}
      placeholder="Studio address or room number..."
      className="border border-green-200 rounded-lg p-3 text-sm text-gray-800 bg-green-50"
      placeholderTextColor="#9CA3AF"
      />
  </View>

  {/* Save Button */}
  <TouchableOpacity
    onPress={handleSaveLinks}
    disabled={savingLinks}
    className={`py-3 px-6 rounded-xl flex-row items-center justify-center ${
      savingLinks ? 'bg-gray-400' : 'bg-gradient-to-r from-blue-500 to-purple-600'
    }`}
    style={!savingLinks ? {
      shadowColor: '#000',
      backgroundColor:'black',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    } : {}}
  >
    {savingLinks ? (
      <ActivityIndicator size="small" color="white" />
    ) : (
      <Ionicons name="save" size={18} color="white" />
    )}
    <Text className="text-white text-sm font-semibold ml-2">
      {savingLinks ? "Saving..." : "Save All Information"}
    </Text>
  </TouchableOpacity>
  
  <Text className="text-xs text-gray-500 mt-2 text-center">
    This will update all feedback records for this student
  </Text>
</View>

      {/* History List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-2">Loading feedback history...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4">
          {adminStudentFeedbacks.length === 0 ? (
            <View className="flex-1 justify-center items-center py-20">
              <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 text-lg font-medium mt-4">No feedback history</Text>
              <Text className="text-gray-400 text-center mt-2">
                This student hasn&apos;t received any feedback yet
              </Text> 
            </View>
          ) : (
            <View className="space-y-4 mb-3">
              {adminStudentFeedbacks.map((feedback, index) => (
                <View key={feedback.id} className="bg-white mb-3 rounded-2xl p-4 shadow-sm">
                  {/* Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <View className="mr-3">
                        <Text className="font-semibold text-gray-800 text-base">
                          Instructor: {instructorNames[feedback.instructor_id] ||
                              "Loading..."}{" "}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {feedback.instructor_email}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <View
                        className="px-3 py-1 rounded-full"
                        style={{ backgroundColor: getSessionTypeColor(feedback.session_type) + '20' }}
                        >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: getSessionTypeColor(feedback.session_type) }}
                          >
                          {feedback.session_type} #{feedback.session_number}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-400 mt-1">
                        {formatDate(feedback.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Rating */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-sm font-medium text-gray-700">Homework Rating:</Text>
                    {renderStars(feedback.homework_rating)}
                  </View>
                  {/* Rating */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-sm font-medium text-gray-700">Comment:</Text>
                    {renderStars(feedback.comment)}
                  </View>

                  {/* Feedback Content */}
                  {feedback.feedback && (
                    <View className="mb-3">
                      <Text className="text-sm font-medium text-gray-700 mb-2">Session Feedback:</Text>
                      <Text className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {feedback.feedback}
                      </Text>
                    </View>
                  )}

                  {/* Homework Comments */}
                  <View className="mb-3">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Homework:</Text>
                    <Text className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      {feedback.HW_comments}
                    </Text>
                  </View>

                  {/* Attached File */}
                  {feedback.sheet && (
                    <View className="flex-row items-center bg-green-50 p-3 rounded-lg">
                      <Ionicons name="document-attach" size={20} color="#10B981" />
                      <Text className="text-green-700 font-medium ml-2">Sheet Music Attached</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
      </ScrollView>
    </SafeAreaView>
  );
};
// 5. Add Admin Student History Screen
const InstructorStudentHistoryScreen: React.FC = () => {

  const [meetingLink, setMeetingLink] = useState('');
const [savingLink, setSavingLink] = useState(false);

const handleSaveMeetingLink = async () => {
  if (!selectedInstructorStudent?.id) {
    Alert.alert("Error", "No student selected");
    return;
  }

  // جِب أحدث feedback للطالب
  const latestFeedback = adminStudentFeedbacks[0]; // لو مرتبين من الأحدث للأقدم

  if (!latestFeedback?.id) {
    Alert.alert("Error", "No feedback available to update");
    return;
  }

  setSavingLink(true);

  const { error } = await supabase
    .from("feedback")
    .update({ meet: meetingLink })
    .eq("id", latestFeedback.id);

  setSavingLink(false);

  if (error) {
    Alert.alert("Error", "Failed to save meeting link");
  } else {
    Alert.alert("Success", "Meeting link saved successfully");
    setMeetingLink('');
  }
};


  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionTypeColor = (sessionType: string) => {
    switch (sessionType) {
      case 'In-Person': return '#10B981';
      case 'Online': return '#3B82F6';
      case 'Theory': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={16}
            color={star <= rating ? "#FBBF24" : "#D1D5DB"}
          />
        ))}
      </View>
    );
  };
const [instructorNames, setInstructorNames] = useState<
      Record<string, string>
    >({});

    useEffect(() => {
      const fetchAllInstructorNames = async () => {
        const names = { ...instructorNames };

        for (const session of adminStudentFeedbacks) {
          const id = session.instructor_id;
          if (id && !names[id]) {
            const name = await getInstructorName(id);
            names[id] = name || "Unknown";
          }
        }

        setInstructorNames(names);
      };

      if (adminStudentFeedbacks.length > 0) {
        fetchAllInstructorNames();
      }
    }, [adminStudentFeedbacks]);
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="bg-white shadow-sm">
        <View className="px-4 py-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => setCurrentScreen("dashboard")}
                className="mr-4 p-2 rounded-full bg-gray-100"
              >
                <Ionicons name="arrow-back" size={20} color="#374151" />
              </TouchableOpacity>
              <View>
                <Text className="text-xl font-bold text-gray-800">
                  Feedback History
                </Text>
                {selectedInstructorStudent && (
                  <Text className="text-sm text-gray-600 mt-1">
                    {selectedInstructorStudent.name} • {selectedInstructorStudent.instrument}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>
      

      {/* History List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-2">Loading feedback history...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4">
          {adminStudentFeedbacks.length === 0 ? (
            <View className="flex-1 justify-center items-center  py-20">
              <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 text-lg font-medium mt-4">No feedback history</Text>
              <Text className="text-gray-400 text-center mt-2">
                This student hasn&apos;t received any feedback yet
              </Text> 
            </View>
          ) : (
            <View className="space-y-4 mb-3">
              {adminStudentFeedbacks.map((feedback, index) => (
                <View key={feedback.id} className="bg-white mb-3 rounded-2xl p-4 shadow-sm">
                  {/* Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <View className="mr-3">
                        <Text className="font-semibold text-gray-800 text-base">
                          Instructor: {instructorNames[feedback.instructor_id] ||
                              "Loading..."}{" "}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {feedback.instructor_email}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <View
                        className="px-3 py-1 rounded-full"
                        style={{ backgroundColor: getSessionTypeColor(feedback.session_type) + '20' }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: getSessionTypeColor(feedback.session_type) }}
                        >
                          {feedback.session_type} #{feedback.session_number}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-400 mt-1">
                        {formatDate(feedback.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Rating */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-sm font-medium text-gray-700">Homework Rating:</Text>
                    {renderStars(feedback.homework_rating)}
                  </View>
                  {/* Rating */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-sm font-medium text-gray-700">Comment:</Text>
                    {renderStars(feedback.comment)}
                  </View>

                  {/* Feedback Content */}
                  {feedback.feedback && (
                    <View className="mb-3">
                      <Text className="text-sm font-medium text-gray-700 mb-2">Session Feedback:</Text>
                      <Text className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {feedback.feedback}
                      </Text>
                    </View>
                  )}

                  {/* Homework Comments */}
                  <View className="mb-3">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Homework:</Text>
                    <Text className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      {feedback.HW_comments}
                    </Text>
                  </View>

                  {/* Attached File */}
                  {feedback.sheet && (
                    <View className="flex-row items-center bg-green-50 p-3 rounded-lg">
                      <Ionicons name="document-attach" size={20} color="#10B981" />
                      <Text className="text-green-700 font-medium ml-2">Sheet Music Attached</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

  // 8. Enhanced ConfirmationScreen with celebration animation
  const ConfirmationScreen: React.FC = () => {
    const navigation = useNavigation();
    const [checkmarkAnim] = useState(new Animated.Value(0));
    const [pulseAnim] = useState(new Animated.Value(1));

    useLayoutEffect(() => {
      navigation.setOptions({ headerShown: false });

      // Checkmark animation
      Animated.spring(checkmarkAnim, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }).start();

      // Pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }, [navigation]);

    return (
      <SafeAreaView className="flex-1" style={{flex: 1}}>
        <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />
        <LinearGradient
          colors={["#F0FDF4", "#EFF6FF"]}
          className="flex-1 justify-center items-center px-6"
        >
          <View className="items-center">
            <Animated.View
              className="w-20 h-20 bg-green-500 rounded-full items-center justify-center shadow-lg mb-6"
              style={{
                transform: [{ scale: checkmarkAnim }, { scale: pulseAnim }],
              }}
            >
              <Ionicons name="checkmark" size={40} color="white" />
            </Animated.View>
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              Feedback Sent!
            </Text>
            <Text className="text-gray-600 mb-6 text-center">
              Feedback has been sent to the parent.
            </Text>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  };
  // 6. Add new screen components after the existing screens:

  const AdminScreen: React.FC = () => {
    const navigation = useNavigation();

    useLayoutEffect(() => {
      navigation.setOptions({ headerShown: false });
    }, [navigation]);

    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

        {/* Header */}
        <View className="bg-white shadow-sm">
          <View className="px-4 py-6">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-2xl font-bold text-gray-800">
                  Admin Panel
                </Text>
                <Text className="text-gray-600 mt-1">Welcome back, Adham</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  handleLogout()
                  setIsAdmin(false);
                }}
                className="w-10 h-10 bg-red-500 rounded-full items-center justify-center"
              >
                <Ionicons name="log-out-outline" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Admin Options */}
        <ScrollView className="flex-1 px-4 py-4">
          <View className="space-y-4 ">
            <TouchableOpacity
              style={{ marginBottom: 10 }}
              onPress={() => {
                setCurrentScreen("admin-students");
                loadAdminStudents();
              }}
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <View className="flex-row items-center justify-between ">
                <View className="flex-row items-center space-x-4">
                  <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center">
                    <Ionicons name="people" size={24} color="white" />
                  </View>
                  <View>
                    <Text className="text-lg font-semibold text-gray-800 ms-2">
                      Manage Students
                    </Text>
                    <Text className="text-sm text-gray-600 ms-2">
                      View and add students
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setCurrentScreen("admin-instructors");
                loadData();
              }}
              className="bg-white rounded-2xl shadow-sm p-6"
            >
              <View className="flex-row items-center justify-between ">
                <View className="flex-row items-center space-x-4">
                  <View className="w-12 h-12 bg-green-500 rounded-full items-center justify-center">
                    <Ionicons name="school" size={24} color="white" />
                  </View>
                  <View>
                    <Text className="text-lg font-semibold text-gray-800 ms-2">
                      Manage Instructors
                    </Text>
                    <Text className="text-sm text-gray-600 ms-2">
                      View and add instructors
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </View>
            </TouchableOpacity>
           
<TouchableOpacity
  onPress={() => {
    setCurrentScreen("admin-files");
    // Load files if needed
  }}
  className="bg-white rounded-2xl shadow-sm p-6 mt-3"
  style={{ marginBottom: 10 }}
>
  <View className="flex-row items-center justify-between">
    <View className="flex-row items-center space-x-4">
      <View className="w-12 h-12 bg-purple-500 rounded-full items-center justify-center">
        <Ionicons name="folder" size={24} color="white" />
      </View>
      <View>
        <Text className="text-lg font-semibold text-gray-800 ms-2">
          Instructor Files
        </Text>
        <Text className="text-sm text-gray-600 ms-2">
          Manage shared resources
        </Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#6B7280" />
  </View>
</TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

const AdminInstructorsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Filter instructors based on search query
  const filteredInstructors = instructors.filter(instructor =>
    instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View className="bg-white shadow-sm">
        <View className="px-4 py-6">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity
                onPress={() => setCurrentScreen("admin")}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Ionicons name="chevron-back" size={20} color="#6B7280" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-800">
                Instructors
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setCurrentScreen("add-instructor")}
              className="bg-blue-500 px-4 py-2 rounded-xl"
            >
              <Text className="text-white font-medium">Add Instructor</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              placeholder="Search instructors by name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-800"
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                className="ml-2"
              >
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        <View className="space-y-3">
          {filteredInstructors.length > 0 ? (
            filteredInstructors.map((instructor) => (
              <View
                key={instructor.id}
                className="bg-white rounded-2xl shadow-sm p-4 mt-3 flex-row items-center justify-between"
              >
                <View
                  className="flex-row items-center space-x-4"
                  style={{ gap: 10, flex: 1 }}
                >
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: instructor.color }}
                  >
                    <Text className="text-white font-semibold text-sm">
                      {instructor.avatar}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">
                      {instructor.name}
                    </Text>
                    <Text className="text-sm text-gray-600">
                     Phone Number: {instructor.phone}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Role: {instructor.role}
                    </Text>
                      {instructor.role2 && (
                    <Text className="text-sm text-gray-600">
                      Role 2: {instructor.role2}
                    </Text>

                      )}

                    <Text className="text-sm text-gray-600">
                      Instrument: {instructor.type}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Password: {instructor.password}
                    </Text>
                    
                    <Text className="text-xs text-gray-500 mt-1">
                     {new Date(instructor.created_at).toLocaleDateString('en-US', { calendar: 'gregory' })}

                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row items-center space-x-2">
                  <TouchableOpacity
                    onPress={() => handleEditInstructorPress(instructor)}
                    className="p-2"
                  >
                    <Ionicons name="create-outline" size={24} color="#3B82F6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(instructor.id, "instructor")}
                    className="p-2"
                  >
                    <Ionicons name="trash" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-2xl shadow-sm p-8 mt-3 items-center">
              <Ionicons name="search" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 text-lg font-medium mt-4">
                No instructors found
              </Text>
              <Text className="text-gray-400 text-sm mt-2 text-center">
                {searchQuery 
                  ? `No instructors match "${searchQuery}"`
                  : "No instructors available"
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};


  const AddStudentScreen: React.FC = () => {
    const navigation = useNavigation();

    useLayoutEffect(() => {
      navigation.setOptions({ headerShown: false });
    }, [navigation]);

    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

        {/* Header */}
        <View className="bg-white shadow-sm">
          <View className="px-4 py-6">
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity
                onPress={() => setCurrentScreen("admin-students")}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Ionicons name="chevron-back" size={20} color="#6B7280" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-800">
                Add Student
              </Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          <AdminStudentForm
            studentForm={studentForm}
            setStudentForm={setStudentForm}
            instructors={instructors}
            handleAddStudent={handleAddStudent}
            loading={loading}
            setLoading ={setLoading}
            setCurrentScreen={setCurrentScreen}
            loadAdminStudents={loadAdminStudents}
            loadData={loadData}
          />
        </ScrollView>
      </SafeAreaView>
    );
  };

  const AddInstructorScreen: React.FC = () => {
    const navigation = useNavigation();

    useLayoutEffect(() => {
      navigation.setOptions({ headerShown: false });
    }, [navigation]);

    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

        {/* Header */}
        <View className="bg-white shadow-sm">
          <View className="px-4 py-6">
            <View className="flex-row items-center space-x-3">
              <TouchableOpacity
                onPress={() => setCurrentScreen("admin-instructors")}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <Ionicons name="chevron-back" size={20} color="#6B7280" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-800">
                Add Instructor
              </Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          <AdminAddInstructorForm
            instructorForm={instructorForm}
            setInstructorForm={setInstructorForm}
            loading={loading}
            setLoading={setLoading}
            instructorId=""
            setCurrentScreen={setCurrentScreen}
            loadAdminInstructors={loadData}
            
          />
        </ScrollView>
      </SafeAreaView>
    );
  };
// Add this new component before the main return statement
const renderSessionInfo = (session: any) => {
  const sessionType = session.session_type;
  let meetingInfo = null;

  if (sessionType === 'Theory' && session.online_theory_meet) {
    meetingInfo = {
      type: 'theory',
      link: session.online_theory_meet,
      icon: 'videocam',
      color: '#8B5CF6',
      bgColor: '#F3E8FF',
      label: 'Theory Meeting'
    };
  } else if (sessionType === 'Online' && session.online_practice_meet) {
    meetingInfo = {
      type: 'practice',
      link: session.online_practice_meet,
      icon: 'musical-notes',
      color: '#3B82F6',
      bgColor: '#EBF4FF',
      label: 'Practice Meeting'
    };
  } else if (sessionType === 'In-Person' && session.in_person_location) {
    meetingInfo = {
      type: 'location',
      link: session.in_person_location,
      icon: 'location',
      color: '#10B981',
      bgColor: '#ECFDF5',
      label: 'Location'
    };
  }

  if (!meetingInfo) return null;

  const handlePress = async () => {
    if (meetingInfo.type === 'location') {
      Alert.alert("Location", meetingInfo.link);
    } else {
      const supported = await Linking.canOpenURL(meetingInfo.link);
      if (supported) {
        await Linking.openURL(meetingInfo.link);
      } else {
        Alert.alert("Error", "Can't open this link");
      }
    }
  };

  return (
    <TouchableOpacity
      className="mt-3 rounded-xl p-3 flex-row items-center justify-between"
      style={{ backgroundColor: meetingInfo.bgColor }}
      onPress={handlePress}
    >
      <View className="flex-row items-center flex-1">
        <View
          className="w-8 h-8 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: meetingInfo.color }}
        >
          <Ionicons    size={16} color="white" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium" style={{ color: meetingInfo.color }}>
            {meetingInfo.label}
          </Text>
          <Text className="text-xs text-gray-600 mt-1" numberOfLines={1}>
            {meetingInfo.type === 'location' ? meetingInfo.link : 'Tap to join'}
          </Text>
        </View>
      </View>
      <Ionicons 
        name={meetingInfo.type === 'location' ? "navigate" : "open-outline"} 
        size={16} 
        style={{ color: meetingInfo.color }} 
      />
    </TouchableOpacity>
  );
};

    // Add the StudentDashboardScreen component
    const StudentDashboardScreen: React.FC = () => {
      
      const navigation = useNavigation();

      useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
      }, [navigation]);
// Add this state to fetch session information
const [sessionInfo, setSessionInfo] = useState({
  online_theory_meet: '',
  online_practice_meet: '',
  in_person_location: ''
});

// Add this function to fetch session information
const fetchSessionInfo = async () => {
  if (!studentProfile?.id) return;

  const { data, error } = await supabase
    .from("feedback")
    .select("Online_Theory_Meet , Online_Practice_Meet, In_person_Location ")
    .eq("student_id", studentProfile.id)
    .limit(1)
    .single();
console.log(studentProfile.id)
  if (error) {
    console.error("Error fetching session info:", error);
  } else if (data) {
    setSessionInfo({
      online_theory_meet: data.Online_Theory_Meet || '',
      online_practice_meet: data.Online_Practice_Meet || '',
      in_person_location: data.In_person_Location || ''
    });
  }
};

// Add this useEffect to fetch session info
useEffect(() => {
  fetchSessionInfo();
}, [studentProfile?.id]);


      const getSessionTypeIcon = (type: string) => {
        switch (type) {
          case "in_person":
            return "people";
          case "online_instrument":
            return "musical-notes";
          case "theory":
            return "book";
          default:
            return "musical-notes";
        }
      };

      const getSessionTypeColor = (type: string) => {
        switch (type) {
          case "In-Person":
            return "#10B981";
          case "Online":
            return "#ce9a20ff";
          case "Theory":
            return "#f50bb3ff";
          default:
            return "#000000ff";
        }
      };

      const formatSessionType = (type: string) => {
        switch (type) {
          case "in_person":
            return "In-Person";
          case "online_instrument":
            return "Online Practice";
          case "theory":
            return "Theory";
          default:
            return type;
        }
      };

      const [instructorNames, setInstructorNames] = useState<
        Record<string, string>
      >({});

      useEffect(() => {
        const fetchAllInstructorNames = async () => {
          const names = { ...instructorNames };

          for (const session of recentSessions) {
            const id = session.instructor_id;
            if (id && !names[id]) {
              const name = await getInstructorName(id);
              names[id] = name || "Unknown";
            }
          }

          setInstructorNames(names);
        };

        if (recentSessions.length > 0) {
          fetchAllInstructorNames();
        }
      }, [recentSessions]);

      const scrollViewRef = useRef<ScrollView>(null);
      const hasScrolledRef = useRef(false);

      const fetchStudentFeedback = async () => {
        if (!studentProfile?.id) return;

        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .eq("student_id", studentProfile.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching feedback:", error);
        } else {
          if (JSON.stringify(data) !== JSON.stringify(recentSessions)) {
            setRecentSessions(data);
            hasScrolledRef.current = false; 
          }
        }

        setDataLoaded(true);
      };

      useEffect(() => {
        fetchStudentFeedback();
      }, [studentProfile?.id]);

      const renderStars = (rating: number) => {
        return (
          <View className="flex-row">
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= rating ? "star" : "star-outline"}
                size={16}
                color={star <= rating ? "#FBBF24" : "#D1D5DB"}
              />
            ))}
          </View>
        );
      };
      const isScrolling = useRef(false);

      const handleScrollBegin = () => (isScrolling.current = true);
      const handleScrollEnd = () => (isScrolling.current = false);

      return (
        <SafeAreaView className="flex-1 bg-gray-50">
          <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

          {/* Header */}
            <View className="px-4 py-6 bg-white">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center space-x-3">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: studentProfile?.color }}
                  >
                    <Text className="text-white font-semibold text-sm ">
                      {studentProfile?.avatar}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-xl font-bold text-gray-800 ms-2"> 
                      {studentProfile?.name}
                    </Text>
                    <Text className="text-sm text-gray-600 ms-2">
                      {studentProfile?.instrument} •{" "}
                      {studentProfile?.instructor_name}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    handleLogout()
                    setCurrentUser(null);
                    setStudentProfile(null);
                    setSessionProgress(null);
                    setRecentSessions([]);
                  }}
                  className="w-10 h-10 bg-red-500 rounded-full items-center justify-center"
                >
                  <Ionicons name="log-out-outline" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          {dataLoaded && (
            <ScrollView
              className="flex-1 px-4 py-4"
              contentContainerStyle={{ flexGrow: 1 }}
              ref={scrollViewRef}
              onScrollBeginDrag={handleScrollBegin}
              onScrollEndDrag={handleScrollEnd}
              scrollEventThrottle={16}
            >
<Animated.View
  className="bg-white rounded-2xl shadow-sm p-6 mb-4"
>
  <Text className="text-lg font-bold text-gray-800 mb-4">
    Session Information
  </Text>

  <View className="space-y-4">
    {/* Online Theory Meeting */}
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center space-x-3">
        <View className="w-8 h-8 bg-purple-500 rounded-full items-center justify-center">
          <Ionicons name="videocam" size={16} color="white" />
        </View>
        <Text className="text-gray-700 font-medium ms-2">
          Theory Meeting
        </Text>
      </View>
      <View className="flex-1 ml-4">
        {sessionInfo.online_theory_meet ? (
          <TouchableOpacity
            className="bg-purple-50 px-3 py-2 rounded-lg flex-row items-center justify-between"
            onPress={async () => {
              const supported = await Linking.canOpenURL(sessionInfo.online_theory_meet);
              if (supported) {
                await Linking.openURL(sessionInfo.online_theory_meet);
              } else {
                Alert.alert("Error", "Can't open this link");
              }
            }}
          >
            <Text className="text-purple-700 text-sm font-medium flex-1" numberOfLines={1}>
              Join Meeting
            </Text>
            <Ionicons name="open-outline" size={16} color="#8B5CF6" />
          </TouchableOpacity>
        ) : (
          <View className="bg-gray-50 px-3 py-2 rounded-lg">
            <Text className="text-gray-400 text-sm">No link available</Text>
          </View>
        )}
      </View>
    </View>

    {/* Online Practice Meeting */}
    <View className="flex-row items-center justify-between mt-2">
      <View className="flex-row items-center space-x-3">
        <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
          <Ionicons name="musical-notes" size={16} color="white" />
        </View>
        <Text className="text-gray-700 font-medium ms-2">
          Practice Meeting
        </Text>
      </View>
      <View className="flex-1 ml-4">
        {sessionInfo.online_practice_meet ? (
          <TouchableOpacity
            className="bg-blue-50 px-3 py-2 rounded-lg flex-row items-center justify-between"
            onPress={async () => {
              const supported = await Linking.canOpenURL(sessionInfo.online_practice_meet);
              if (supported) {
                await Linking.openURL(sessionInfo.online_practice_meet);
              } else {
                Alert.alert("Error", "Can't open this link");
              }
            }}
          >
            <Text className="text-blue-700 text-sm font-medium flex-1" numberOfLines={1}>
              Join Meeting
            </Text>
            <Ionicons name="open-outline" size={16} color="#3B82F6" />
          </TouchableOpacity>
        ) : (
          <View className="bg-gray-50 px-3 py-2 rounded-lg">
            <Text className="text-gray-400 text-sm">No link available</Text>
          </View>
        )}
      </View>
    </View>

    {/* In-Person Location */}
    <View className="flex-row items-center justify-between mt-2">
      <View className="flex-row items-center space-x-3">
        <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center">
          <Ionicons name="location" size={16} color="white" />
        </View>
        <Text className="text-gray-700 font-medium ms-2">
          Location
        </Text>
      </View>
      <View className="flex-1 ml-4">
        {sessionInfo.in_person_location ? (
          <TouchableOpacity
            className="bg-green-50 px-3 py-2 rounded-lg flex-row items-center justify-between"
            onPress={() => {
              Alert.alert("Location", sessionInfo.in_person_location, [
                { text: "OK" },
                {
                  text: "Open Maps",
                  onPress: async () => {
                    const url = `https://maps.google.com/?q=${encodeURIComponent(sessionInfo.in_person_location)}`;
                    const supported = await Linking.canOpenURL(url);
                    if (supported) {
                      await Linking.openURL(url);
                    }
                  }
                }
              ]);
            }}
          >
            <Text className="text-green-700 text-sm font-medium flex-1" numberOfLines={1}>
              {sessionInfo.in_person_location}
            </Text>
            <Ionicons name="navigate" size={16} color="#10B981" />
          </TouchableOpacity>
        ) : (
          <View className="bg-gray-50 px-3 py-2 rounded-lg">
            <Text className="text-gray-400 text-sm">No location set</Text>
          </View>
        )}
      </View>
    </View>
  </View>
</Animated.View>
                    {/* Session Progress */}
                    <Animated.View
                      className="bg-white rounded-2xl shadow-sm p-6 mb-4"
                      // style={{
                      //   opacity: fadeAnim,
                      //   transform: [{ translateY: slideAnim }]
                      // }}
                    >
                      <Text className="text-lg font-bold text-gray-800 mb-4">
                        {sessionProgress?.month} {sessionProgress?.year} Progress
                      </Text>
      
                      <View className="space-y-4">
                        {/* In-Person Sessions */}
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center space-x-3">
                            <View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center">
                              <Ionicons name="people" size={16} color="white" />
                            </View>
                            <Text className="text-gray-700 font-medium ms-2">
                              In-Person
                            </Text>
                          </View>
                          <View className="flex-row items-center space-x-2">
                            <View className="w-16 h-2 bg-gray-200 rounded-full">
                              <View
                                className="h-2 bg-green-500 rounded-full"
                                style={{
                                  width: `${
                                    ((sessionProgress?.in_person_completed || 0) / 4) *
                                    100
                                  }%`,
                                }}
                              />
                            </View>
                            <Text className="text-sm font-medium text-gray-600">
                              {sessionProgress?.in_person_completed || 0}/4
                            </Text>
                          </View>
                        </View>
      
                        {/* Online Instrument Sessions */}
                        <View className="flex-row items-center justify-between mt-2">
                          <View className="flex-row items-center space-x-3">
                            <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center">
                              <Ionicons name="musical-notes" size={16} color="white" />
                            </View>
                            <Text className="text-gray-700 font-medium ms-2">
                              Online Practice
                            </Text>
                          </View>
                          <View className="flex-row items-center space-x-2">
                            <View className="w-16 h-2 bg-gray-200 rounded-full">
                              <View
                                className="h-2 bg-blue-500 rounded-full"
                                style={{
                                  width: `${
                                    ((sessionProgress?.online_instrument_completed ||
                                      0) /
                                      4) *
                                    100
                                  }%`,
                                }}
                              />
                            </View>
                            <Text className="text-sm font-medium text-gray-600">
                              {sessionProgress?.online_instrument_completed || 0}/4
                            </Text>
                          </View>
                        </View>
      
                        {/* Theory Sessions */}
                        <View className="flex-row items-center justify-between mt-2">
                          <View className="flex-row items-center space-x-3">
                            <View className="w-8 h-8 bg-yellow-500 rounded-full items-center justify-center">
                              <Ionicons name="book" size={16} color="white" />
                            </View>
                            <Text className="text-gray-700 font-medium ms-2">
                              Theory
                            </Text>
                          </View>
                          <View className="flex-row items-center space-x-2">
                            <View className="w-16 h-2 bg-gray-200 rounded-full">
                              <View
                                className="h-2 bg-yellow-500 rounded-full"
                                style={{
                                  width: `${
                                    ((sessionProgress?.theory_completed || 0) / 4) * 100
                                  }%`,
                                }}
                              />
                            </View>
                            <Text className="text-sm font-medium text-gray-600">
                              {sessionProgress?.theory_completed || 0} /4
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Animated.View>
              {/* const progress = {
      in_person_completed: inPersonTotal,
      online_instrument_completed: onlineTotal,
      theory_completed: theoryTotal,
      total_sessions: inPersonTotal + onlineTotal + theoryTotal,
      month: new Date().toLocaleDateString('en-US', { month: 'long' }),
      year: new Date().getFullYear(),
    };*/}

<Animated.View className="bg-white rounded-2xl shadow-sm p-6">
  <Text className="text-lg font-bold text-gray-800 mb-4">
    Sessions Feedback
  </Text>

  <View className="space-y-6">
    {(() => {
      // Group sessions by type
      const groupedSessions: GroupedSessions = recentSessions.reduce((groups: GroupedSessions, session: any) => {
        const sessionType: string = formatSessionType(session.session_type);
        if (!groups[sessionType]) {
          groups[sessionType] = [];
        }
        groups[sessionType].push(session);
        return groups;
      }, {});

      // Define the order and display info for session types
      const sessionTypeConfig: Record<string, SessionTypeConfig> = {
        'Theory': {
          color: '#f50bb3ff',
          icon: 'book',
          bgColor: '#fdf2f8'
        },
        'Online': {
          color: '#ce9a20ff',
          icon: 'musical-notes',
          bgColor: '#fffbeb'
        },
        'In-Person': {
          color: '#10B981',
          icon: 'people',
          bgColor: '#f0fdf4'
        }
      };

      return Object.entries(sessionTypeConfig).map(([sessionType, config]: [string, SessionTypeConfig]) => {
        const sessions: any[] = groupedSessions[sessionType] || [];
        
        if (sessions.length === 0) return null;

        const isGroupExpanded: boolean = expandedGroupIds.has(sessionType);

        return (
          <View key={sessionType} className="mb-4">
            {/* Session Type Header - Clickable */}
            <TouchableOpacity 
              className="flex-row items-center justify-between mb-3 pb-2 border-b border-gray-200"
              onPress={() => toggleGroupExpand(sessionType)}
            >
              <View className="flex-row items-center">
                <View 
                  className="w-6 h-6 rounded-full items-center justify-center mr-2"
                  style={{ backgroundColor: config.color }}
                >
                  <Ionicons name={config.icon as any} size={12} color="white" />
                </View>
                <Text className="text-base font-semibold text-gray-800">
                  {sessionType} Sessions ({sessions.length})
                </Text>
              </View>
              <Ionicons
                name={isGroupExpanded ? "chevron-up-outline" : "chevron-down-outline"}
                size={24}
                color="#315eb9ff"
              />
            </TouchableOpacity>

            {/* Sessions in this group - Only show if group is expanded */}
            {isGroupExpanded && (
              <View 
                className="rounded-lg p-3 space-y-3"
                style={{ backgroundColor: config.bgColor }}
              >
                {Array.isArray(sessions) && sessions.map((session: any, index: number) => (
                  <View
                    key={session.id}
                    className={`${index !== sessions.length - 1 ? 'border-b border-gray-200 pb-3 mb-3' : ''}`}
                  >
                    {/* Session Header - Non-clickable now */}
                    <View className="flex-row justify-between items-center mb-2">
                      <View className="flex-row items-center space-x-2">
                        <Text className="font-medium text-gray-800 text-sm">
                          Session {session.session_number}/4
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          • {instructorNames[session.instructor_id] || "Loading..."}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-500">
  {new Date(session.created_at).toLocaleDateString('en-US', { calendar: 'gregory' })}
                      </Text>
                    </View>

                    {/* Session Content - Always visible when group is expanded */}
                    <View className="pl-2">
                      {/* Ratings */}
                      {session.homework_rating && session.comment && (
                        <View className="flex-row items-center justify-between mb-3">
                          <View className="items-center">
                            <Text className="text-xs text-gray-500 mb-1">Homework Rating</Text>
                            {renderStars(session.homework_rating)}
                          </View>
                          <View className="items-center">
                            <Text className="text-xs text-gray-500 mb-1">Session Rating</Text>
                            {renderStars(session.comment)}
                          </View>
                        </View>
                      )}

                      {/* Session Feedback */}
                      {session.feedback && (
                        <View className="bg-white rounded-lg p-3 mb-2 shadow-sm">
                          <Text className="text-xs text-gray-500 mb-1">Session Feedback:</Text>
                          <Text className="text-sm text-gray-700">{session.feedback}</Text>
                        </View>
                      )}

                      {/* Homework Comments */}
                      {session.HW_comments && (
                        <View className="mb-2">
                          <Text className="text-xs text-gray-500 mb-1">Homework Feedback:</Text>
                          <View className="bg-white rounded-lg p-2 shadow-sm">
                            <Text className="text-sm text-gray-700">{session.HW_comments}</Text>
                          </View>
                        </View>
                      )}

                      {/* Sheet Music Link */}
                      {session.sheet && (
                        <TouchableOpacity
                          className="flex-row items-center space-x-2 mt-2 bg-white rounded-lg p-2 shadow-sm"
                          onPress={async () => {
                            const url: string = session.sheet;
                            if (!url) return;

                            const supported: boolean = await Linking.canOpenURL(url);
                            if (supported) {
                              await Linking.openURL(url);
                            } else {
                              Alert.alert("Error", "Can't open this URL");
                            }
                          }}
                        >
                          <Ionicons name="document-text" size={16} color="#3B82F6" />
                          <Text className="text-blue-600 text-sm">View Sheet Music</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      }).filter(Boolean); // Remove null entries
    })()}

    {/* No sessions message */}
    {recentSessions.length === 0 && (
      <View className="items-center py-8">
        <Ionicons
          name="musical-notes-outline"
          size={48}
          color="#D1D5DB"
        />
        <Text className="text-gray-500 mt-2">
          No recent sessions
        </Text>
      </View>
    )}
  </View>
</Animated.View>
          </ScrollView>
)}
        </SafeAreaView>
      );
    };

  useEffect(() => {
    const restoreScreen = async (): Promise<void> => {
      try {
        const keep = await AsyncStorage.getItem("keepLoggedIn");
        const screen = await AsyncStorage.getItem("initialScreen");

        if (keep === "true" && screen) {
          setCurrentScreen(screen as any); // أو استبدل `any` بالنوع المناسب
        } else {
          setCurrentScreen("login");
        }
      } catch (error) {
        console.error("Failed to restore screen:", error);
        setCurrentScreen("login");
      }
    };

    restoreScreen();
  }, []);

  const renderScreen = (): React.ReactElement => {
    switch (currentScreen) {
      case "login":
        return <LoginScreen />;
      case "dashboard":
        return <DashboardScreen />;
      case "feedback":
        return <FeedbackScreen />;
      case "confirmation":
        return <ConfirmationScreen />;
      case "admin":
        return <AdminScreen />;
      case "admin-students":
        return <AdminStudentsScreen />;
      case "admin-instructors":
        return <AdminInstructorsScreen />;
      case "add-student":
        return <AddStudentScreen />;
      case "add-instructor":
        return <AddInstructorScreen />;
      case "student-dashboard":
        return <StudentDashboardScreen />;
      case "edit-student":
        return <EditStudentScreen />;
      case "admin-student-history":
        return <AdminStudentHistoryScreen />;
      case "instructor-student-history":
        return <InstructorStudentHistoryScreen />;
      case "edit-instructor":
        return <EditInstructorScreen />;
      case "admin-files":
        return <RenderAdminFileManager />
      default:
        return <LoginScreen />;
    }
  };
  return renderScreen();
};

export default MusicInstructorApp;

import { supabase } from '@/supabase';
import { Picker } from '@react-native-picker/picker';
import { createClient } from '@supabase/supabase-js';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

type StudentFormData = {
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
};

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

type StudentFormProps = {
  studentForm: StudentFormData;
  setStudentForm: React.Dispatch<React.SetStateAction<StudentFormData>>;
  instructors: Array<{ id: string; name: string }>;
  handleAddStudent: () => Promise<void>;
  loading: boolean;
  loadData: () => Promise<void>;
  isEdit?: boolean;
  studentId?: string | null;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentScreen: React.Dispatch<React.SetStateAction<ScreenType>>;
  loadAdminStudents: () => Promise<void>;
};

const StudentForm: React.FC<StudentFormProps> = ({
  studentForm,
  setStudentForm,
  instructors,
  handleAddStudent,
  loadData,
  isEdit,
  studentId,
  setLoading,
  setCurrentScreen,
  loadAdminStudents,
  loading,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [allInstructors, setAllInstructors] = useState<any[]>([]);

  // Form state - initialize with existing data in edit mode
  const [formData, setFormData] = useState<StudentFormData>(() => {
    if (isEdit && studentForm) {
      return { ...studentForm };
    }
    return {
      name: '',
      instrument: '',
      student_email: '',
      father_email: '',
      mother_email: '',
      in_person_id: '',
      in_person_name: '',
      theory_instructor_id: '',
      theory_instructor_name: '',
      online_instructor_id: '',
      online_instructor_name: '',
      instructor_id: '',
      created_at: '',
      mother_phone: '',
      Student_Phone_Number: '',
      father_phone: '',
      password: '',
    };
  });

  // Function to update form data
  const updateFormData = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to reset form
  const resetForm = () => {
    setFormData({
      name: '',
      instrument: '',
      student_email: '',
      father_email: '',
      mother_email: '',
      in_person_id: '',
      in_person_name: '',
      theory_instructor_id: '',
      theory_instructor_name: '',
      online_instructor_id: '',
      online_instructor_name: '',
      instructor_id: '',
      created_at: '',
      mother_phone: '',
      Student_Phone_Number: '',
      father_phone: '',
      password: '',
    });
  };

  const handleSubmitStudent = async (): Promise<void> => {
    // Validate required fields
    if (
      !formData.name ||
      !formData.student_email ||
      !formData.instrument ||
      !formData.mother_phone ||
      !formData.theory_instructor_id ||
      !formData.in_person_id ||
      (!isEdit && !formData.password)
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        if (!studentId) {
          Alert.alert("Error", "Student ID is required for editing");
          return;
        }

        const { error } = await supabase
          .from("students")
          .update({
            name: formData.name,
            instrument: formData.instrument,
            student_email: formData.student_email,
            father_email: formData.father_email,
            father_phone: formData.father_phone,
            mother_email: formData.mother_email,
            mother_phone: formData.mother_phone,
            in_person_id: formData.in_person_id,
            in_person_name: formData.in_person_name,
            theory_instructor_id: formData.theory_instructor_id,
            student_phone_number: formData.Student_Phone_Number,
            theory_instructor_name: formData.theory_instructor_name,
            online_instructor_id: formData.online_instructor_id,
            online_instructor_name: formData.online_instructor_name,
            avatar: formData.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase(),
          })
          .eq('id', studentId);

        if (error) {
          console.log("Database Error:", error);
          Alert.alert("Error", error.message);
          return;
        };

        await loadData();
       await loadAdminStudents();
        Alert.alert("Success", "Student updated successfully");
        setCurrentScreen("admin-students");
      } else {
        const supabaseAdmin = createClient(
          "https://cgzypavgkpiklnzvjoxt.supabase.co",
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnenlwYXZna3Bpa2xuenZqb3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE2MDU1OCwiZXhwIjoyMDY3NzM2NTU4fQ.qg4LJ0cjf2iaYbFmeNIXYMKmBqG923F1Bp-Y8tBwSVA"
        );

        const { data: authData, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: formData.student_email,
            password: formData.password,
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

        const { error } = await supabaseAdmin.from("students").insert([
          {
            name: formData.name,
            instrument: formData.instrument,
            student_email: formData.student_email,
            father_email: formData.father_email,
            father_phone: formData.father_phone,
            mother_email: formData.mother_email,
            mother_phone: formData.mother_phone,
            in_person_id: formData.in_person_id,
            in_person_name: formData.in_person_name,
            theory_instructor_id: formData.theory_instructor_id,
            student_phone_number: formData.Student_Phone_Number,
            theory_instructor_name: formData.theory_instructor_name,
            online_instructor_id: formData.online_instructor_id,
            online_instructor_name: formData.online_instructor_name,
            password: formData.password,
            user_id: authData.user?.id,
            avatar: formData.name
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
            ][Math.floor(Math.random() * 10)],
          },
        ]);

        if (error) {
          console.log("Database Error:", error);
          Alert.alert("Error", error.message);
          return;
        }

        Alert.alert("Success", "Student added successfully");
        resetForm();
              await loadData()
        loadAdminStudents()
        setTimeout(() => {
          setCurrentScreen("admin-students");
        }, 2000);
      }
      
      await loadAdminStudents();

    } catch (error) {
      console.error('Error submitting student:', error);
      Alert.alert("Error", `Failed to ${isEdit ? 'update' : 'add'} student. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    const { data, error } = await supabase
      .from('instructors')
      .select('*');

    if (error) {
      console.error('Error fetching instructors:', error);
      return;
    }

    setAllInstructors(data);
  };

  useEffect(() => {
    if (isEdit && studentForm) {
      setFormData({ ...studentForm });
    }
  }, [isEdit, studentForm]);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleInput = (
    field: keyof StudentFormData,
    optional: string,
    label: string,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'numeric' = 'default',
    secureTextEntry: boolean = false
  ) => {
    if (field === 'instrument') {
      return (
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <Text className="text-sm font-semibold text-gray-700 mb-3">{label}</Text>
          <View className="border border-gray-200 rounded-xl overflow-hidden">
            <Picker
              selectedValue={formData.instrument}
              onValueChange={(value) => updateFormData('instrument', value)}
            >
              <Picker.Item label="Choose Instrument" value="" color="#000" />
              <Picker.Item label="Piano" value="Piano" color="#000" />
              <Picker.Item label="Violin" value="Violin" color="#000" />
              <Picker.Item label="Guitar" value="Guitar" color="#000" />
            </Picker>
          </View>
        </View>
      );
    }

    return (
      <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
        <Text className="text-sm font-semibold text-gray-700 mb-3">
          {label} {optional && `(${optional})`}
        </Text>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={formData[field] as string}
          onChangeText={(value) => updateFormData(field, value)}
          className="w-full p-3 border border-gray-200 rounded-xl text-gray-800"
          keyboardType={keyboardType}
          autoCapitalize="none"
          secureTextEntry={secureTextEntry}
        />
      </View>
    );
  };

  // Updated function with toggle functionality
  const handleInstructorSelection = (
    instructorId: string,
    instructorName: string,
    type: 'in_person' | 'online' | 'theory'
  ) => {
    switch (type) {
      case 'in_person':
        // Toggle selection - if already selected, unselect it
        if (formData.in_person_id === instructorId) {
          updateFormData('in_person_id', '');
          updateFormData('in_person_name', '');
        } else {
          updateFormData('in_person_id', instructorId);
          updateFormData('in_person_name', instructorName);
        }
        break;
      case 'online':
        // Toggle selection - if already selected, unselect it
        if (formData.online_instructor_id === instructorId) {
          updateFormData('online_instructor_id', '');
          updateFormData('online_instructor_name', '');
        } else {
          updateFormData('online_instructor_id', instructorId);
          updateFormData('online_instructor_name', instructorName);
        }
        break;
      case 'theory':
        // Toggle selection - if already selected, unselect it
        if (formData.theory_instructor_id === instructorId) {
          updateFormData('theory_instructor_id', '');
          updateFormData('theory_instructor_name', '');
        } else {
          updateFormData('theory_instructor_id', instructorId);
          updateFormData('theory_instructor_name', instructorName);
        }
        break;
    }
  };

  return (
    <ScrollView ref={scrollViewRef} className="flex-1">
      <View className="space-y-4 p-4">
        {handleInput('name', 'Required', 'Student Name', 'Enter student name')}
        {handleInput('instrument', 'Required', 'Instrument', 'Select instrument')}
        {handleInput('student_email', 'Required', 'Student Email', 'student@example.com', 'email-address')}
        {handleInput('father_email', 'Optional', 'Father Name', 'Enter Father Name', 'default')}
        {handleInput('father_phone', 'Optional', 'Father Phone Number', '+20123456789')}
        {handleInput('mother_email', 'Optional', 'Mother Name', 'Enter Mother Name', 'default')}
        {handleInput('mother_phone', 'Required', 'Mother Phone Number', '+20123456789')}
        {handleInput('Student_Phone_Number', 'Optional', 'Student Phone Number', '+20123456789')}
        {!isEdit && handleInput('password', 'Required', 'Password', '••••••••', 'default', true)}

        {/* In-Person Instructors */}
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <Text className="text-sm font-semibold text-gray-700 mb-3">In-Person Instructors (Required)</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 5 }}
          > 
            <View className="flex-row space-x-2">
              {allInstructors
                .filter((i) => i.role === 'In_person' || i.role2 === 'In_person')
                .map((instructor) => (
                  <TouchableOpacity
                    key={instructor.id}
                    style={{marginRight: 8}}
                    onPress={() => handleInstructorSelection(instructor.id, instructor.name, 'in_person')}
                    className={`px-4 py-2 rounded-xl border ${
                      formData.in_person_id === instructor.id
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        formData.in_person_id === instructor.id
                          ? 'text-white font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {instructor.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </ScrollView>
        </View>

        {/* Online Instructors */}
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Online Instructors (Optional)</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 5 }}
          >
            <View className="flex-row space-x-2">
              {allInstructors
                .filter((i) => i.role === 'Online_Instructor' || i.role2 === 'Online_Instructor')
                .map((instructor) => (
                  <TouchableOpacity
                    key={instructor.id}
                    style={{marginRight: 8}}
                    onPress={() => handleInstructorSelection(instructor.id, instructor.name, 'online')}
                    className={`px-4 py-2 rounded-xl border ${
                      formData.online_instructor_id === instructor.id
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        formData.online_instructor_id === instructor.id
                          ? 'text-white font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {instructor.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </ScrollView>
        </View>

        {/* Theory Instructors */}
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <Text className="text-sm font-semibold text-gray-700 mb-3">Theory Instructors (Required)</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 5 }}
          >
            <View className="flex-row space-x-2">
              {allInstructors
                .filter((i) => i.role === 'Theory_Instructor' || i.role2 === 'Theory_Instructor')
                .map((instructor) => (
                  <TouchableOpacity
                    key={instructor.id}
                    style={{marginRight: 8}}
                    onPress={() => handleInstructorSelection(instructor.id, instructor.name, 'theory')}
                    className={`px-4 py-2 rounded-xl border ${
                      formData.theory_instructor_id === instructor.id
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        formData.theory_instructor_id === instructor.id
                          ? 'text-white font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {instructor.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity
          onPress={handleSubmitStudent}
          disabled={loading}
          className={`w-full py-4 rounded-xl shadow-lg mb-6 ${
            loading ? 'bg-gray-400' : 'bg-blue-500 active:bg-blue-600'
          }`}
        >
          <Text className="text-white font-semibold text-center text-lg">
            {loading ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update Student' : 'Add Student')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default StudentForm;
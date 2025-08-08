import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '@/supabase';
import { createClient } from '@supabase/supabase-js';

type InstructorFormData = {
  id?: string;
  name: string;
  role: string;
  email: string;
  role2:string;
  phone: string;
  password: string;
  type: string;
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

type InstructorFormProps = {
  instructorForm: InstructorFormData;
  setInstructorForm: React.Dispatch<React.SetStateAction<InstructorFormData>>;
  loading: boolean;
  isEdit?: boolean;
  instructorId: string;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentScreen: React.Dispatch<React.SetStateAction<ScreenType>>;
  loadAdminInstructors: () => Promise<void>;
};

const AdminAddInstructorForm: React.FC<InstructorFormProps> = ({
  instructorForm,
  setInstructorForm,
  isEdit,
  loading,
  setLoading,
  instructorId,
  setCurrentScreen,
  loadAdminInstructors,
}) => {
  // Use refs for form inputs to avoid re-renders
  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  
  // Local state to track current values without causing re-renders
  const [localForm, setLocalForm] = useState<InstructorFormData>(instructorForm);

  // Update local form when instructorForm prop changes (for edit mode)
  useEffect(() => {
    setLocalForm(instructorForm);
  }, [instructorForm]);

  const handleSubmitInstructor = async (): Promise<void> => {
    // Validate required fields using local state
    if (
      !localForm.name ||
      !localForm.email ||
      !localForm.role ||
      !localForm.type ||
      !localForm.phone ||
      (!isEdit && !localForm.password)
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // Additional validation for edit mode
    if (isEdit && !instructorId) {
      console.log(instructorId)
      Alert.alert("Error", "Instructor ID is missing. Cannot update instructor.");
      return;
    }
    setLoading(true);

    try {
      if (isEdit) {
        // Handle edit mode - update existing instructor
        const updateData = {
          name: localForm.name,
          role: localForm.role,
          email: localForm.email,
          phone: localForm.phone,
          role2:localForm.role2,
          type: localForm.type,
          avatar: localForm.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase(),
        };

        const { data, error } = await supabase
          .from("instructors")
          .update(updateData)
          .eq('id', instructorId)
          .select();

        if (error) {
          console.error("Database Error:", error);
          Alert.alert("Error", `Failed to update instructor: ${error.message}`);
          return;
        }

        if (!data || data.length === 0) {
          console.error("No instructor found with ID:", localForm.id);
          Alert.alert("Error", "Instructor not found. It may have been deleted.");
          return;
        }

        Alert.alert("Success", "Instructor updated successfully");
        // Update parent state with all changes at once
        setInstructorForm(localForm);
        setCurrentScreen("admin-instructors");
      } else {
        // Handle create mode - add new instructor
        const supabaseAdmin = createClient(
          "https://cgzypavgkpiklnzvjoxt.supabase.co",
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnenlwYXZna3Bpa2xuenZqb3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjE2MDU1OCwiZXhwIjoyMDY3NzM2NTU4fQ.qg4LJ0cjf2iaYbFmeNIXYMKmBqG923F1Bp-Y8tBwSVA"
        );

        // Create user account
        const { data: authData, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: localForm.email,
            password: localForm.password,
            email_confirm: true,
          });

        if (createError) {
          console.error("Auth creation error:", createError);
          Alert.alert("Error", `Failed to create user account: ${createError.message}`);
          return;
        }

        if (!authData.user) {
          Alert.alert("Error", "Failed to create user account - no user data returned");
          return;
        }

        // Mark email as confirmed
        const { error: updateError } = await supabaseAdmin
          .from("auth.users")
          .update({ email_confirmed_at: new Date().toISOString() })
          .eq("id", authData.user.id);

        if (updateError) {
          console.error("Failed to mark email as confirmed:", updateError);
        }

        // Add instructor to database
        const { data: instructorData, error } = await supabaseAdmin
          .from("instructors")
          .insert([
            {
              name: localForm.name,
              role: localForm.role,
              email: localForm.email,
              phone: localForm.phone,
              role2:localForm.role2,
              type: localForm.type,
              password: localForm.password,
              user_id: authData.user.id,
              avatar: localForm.name
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
          ])
          .select();

        if (error) {
          console.error("Database Error:", error);
          Alert.alert("Error", `Failed to add instructor: ${error.message}`);
          return;
        }

        Alert.alert("Success", "Instructor added successfully");
        
        // Reset both local and parent form states
        const emptyForm = {
          name: '',
          role: '',
          email: '',
          phone: '',
          role2:"",
          password: '',
          type: '',
        };
        setLocalForm(emptyForm);
        setInstructorForm(emptyForm);
        
        setTimeout(() => {
          setCurrentScreen("admin-instructors");
        }, 2000);
      }
      
      await loadAdminInstructors();

    } catch (error) {
      console.error('Error submitting instructor:', error);
      Alert.alert("Error", `Failed to ${isEdit ? 'update' : 'add'} instructor. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (
    field: keyof InstructorFormData,
    label: string,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'numeric' = 'default',
    secureTextEntry = false,
    required: boolean = true
  ) => {
    if (field === 'role') {
      return (
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            {label} {required && '(Required)'}
          </Text>
          <View className="border border-gray-200 rounded-xl overflow-hidden">
            <Picker
              selectedValue={localForm.role}
              onValueChange={(value) => {
                setLocalForm(prev => ({ ...prev, role: value }));
                // Don't update parent state here - only on submit
              }}
              dropdownIconColor="#000"
            >
              <Picker.Item label="Role..." value="" color="#000" />
              <Picker.Item label="Online Instructor" value="Online_Instructor" color="#000" />
              <Picker.Item label="Theory Instructor" value="Theory_Instructor" color="#000" />
              <Picker.Item label="In-Person Instructor" value="In_person" color="#000" />
            </Picker>
          </View>
        </View>
      );
    }
    if (field === 'role2') {
      return (
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            {label} Optional
          </Text>
          <View className="border border-gray-200 rounded-xl overflow-hidden">
            <Picker
              selectedValue={localForm.role2}
              onValueChange={(value) => {
                setLocalForm(prev => ({ ...prev, role2: value }));
                // Don't update parent state here - only on submit
              }}
              dropdownIconColor="#000"
            >
              <Picker.Item label="Role 2" value="" color="#000" />
              <Picker.Item label="Online Instructor" value="Online_Instructor" color="#000" />
              <Picker.Item label="Theory Instructor" value="Theory_Instructor" color="#000" />
              <Picker.Item label="In-Person Instructor" value="In_person" color="#000" />
            </Picker>
          </View>
        </View>
      );
    }

    if (field === 'type') {
      return (
        <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
          <Text className="text-sm font-semibold text-gray-700 mb-3">
            {label} {required && '(Required)'}
          </Text>
          <View className="border border-gray-200 rounded-xl overflow-hidden">
            <Picker
              selectedValue={localForm.type}
              onValueChange={(value) => {
                setLocalForm(prev => ({ ...prev, type: value }));
                // Don't update parent state here - only on submit
              }}
              dropdownIconColor="#000"
            >
              <Picker.Item label="Type" value="" color="#000" />
              <Picker.Item label="Piano" value="Piano" color="#000" />
              <Picker.Item label="Guitar" value="Guitar" color="#000" />
              <Picker.Item label="Violin" value="Violin" color="#000" />
              <Picker.Item label="Vocal" value="Vocal" color="#000" />
              <Picker.Item label="Theory" value="Theory" color="#000" />
            </Picker>
          </View>
        </View>
      );
    }

    // Get the appropriate ref based on field
    let inputRef: React.RefObject<TextInput | null> | undefined;
    switch(field) {
      case 'name':
        inputRef = nameRef;
        break;
      case 'email':
        inputRef = emailRef;
        break;
      case 'phone':
        inputRef = phoneRef;
        break;
      case 'password':
        inputRef = passwordRef;
        break;
    }

    return (
      <View className="bg-white rounded-2xl shadow-sm p-4 mb-3">
        <Text className="text-sm font-semibold text-gray-700 mb-3">
          {label} {required && '(Required)'}
        </Text>
        <TextInput
          ref={inputRef}
          placeholder={placeholder}
          placeholderTextColor="#999"
          defaultValue={localForm[field] as string}
          onChangeText={(text) => {
            // Only update local state - no parent state updates
            setLocalForm(prev => ({ ...prev, [field]: text }));
          }}
          className="w-full p-3 border border-gray-200 rounded-xl text-gray-800"
          keyboardType={keyboardType}
          autoCapitalize="none"
          secureTextEntry={secureTextEntry}
        />
      </View>
    );
  };

  return (
    <ScrollView className="flex-1">
      <View className="space-y-4 p-4">        
        {handleInput('name', 'Instructor Name', 'Enter instructor name')}
        {handleInput('email', 'Email', 'instructor@example.com', 'email-address')}
        {handleInput('phone', 'Phone', 'Enter phone number')}
        {handleInput('role', 'Role', 'Select role')}
        {handleInput('role2', 'Role', 'Select role Two')}
        {handleInput('type', 'Type', 'Select type')}
        {!isEdit && handleInput('password', 'Password', 'Enter password', 'default', true)}

        <TouchableOpacity
          onPress={handleSubmitInstructor}
          disabled={loading}
          className={`w-full py-4 rounded-xl shadow-lg mb-6 ${
            loading ? 'bg-gray-400' : 'bg-blue-500 active:bg-blue-600'
          }`}
        >
          <Text className="text-white font-semibold text-center text-lg">
            {loading ? (isEdit ? 'Updating...' : 'Adding...') : isEdit ? 'Update Instructor' : 'Add Instructor'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default AdminAddInstructorForm;
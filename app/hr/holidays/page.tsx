// app/hr/holidays/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/providers";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { Topbar } from "@/components/layout/Topbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Gift,
  Building2,
  Clock,
  CalendarDays,
  Star,
  MapPin,
  Sparkles,
  Loader2,
  Filter,
} from "lucide-react";

// Types
interface Holiday {
  id: string;
  name: string;
  date: string;
  type: "public" | "company" | "religious" | "national";
  description?: string;
  isRecurring?: boolean;
  location?: string;
  year?: number;
  createdAt?: any;
  updatedAt?: any;
}

// Mozambican Public Holidays
const MOZAMBICAN_HOLIDAYS = [
  { name: "New Year's Day", date: "01-01", type: "public", description: "Ano Novo" },
  { name: "Martyrs of Colonial Repression Day", date: "02-03", type: "public", description: "Dia dos Heróis Moçambicanos" },
  { name: "Women's Day", date: "04-07", type: "public", description: "Dia da Mulher Moçambicana" },
  { name: "Labour Day", date: "05-01", type: "public", description: "Dia do Trabalhador" },
  { name: "Independence Day", date: "06-25", type: "national", description: "Dia da Independência Nacional" },
  { name: "Victory Day", date: "09-07", type: "public", description: "Dia da Vitória" },
  { name: "Peace Day", date: "10-04", type: "public", description: "Dia da Paz" },
  { name: "Christmas Day", date: "12-25", type: "religious", description: "Natal" },
  { name: "Family Day", date: "12-26", type: "public", description: "Dia da Família" },
];

function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getMozambicanHolidaysForYear(year: number): Omit<Holiday, 'id'>[] {
  const holidays: Omit<Holiday, 'id'>[] = [];

  MOZAMBICAN_HOLIDAYS.forEach((holiday) => {
    const [month, day] = holiday.date.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      holidays.push({
        name: holiday.name,
        date: date.toISOString().split("T")[0],
        type: holiday.type as "public" | "national" | "religious" | "company",
        description: holiday.description || "",
        isRecurring: true,
        location: "Mozambique",
        year: year,
      });
    }
  });

  const easterDate = getEasterDate(year);
  const easterMonday = new Date(easterDate);
  easterMonday.setDate(easterMonday.getDate() + 1);
  holidays.push({
    name: "Easter Monday",
    date: easterMonday.toISOString().split("T")[0],
    type: "religious",
    description: "Segunda-feira de Páscoa",
    isRecurring: true,
    location: "Mozambique",
    year: year,
  });

  return holidays;
}

export default function HolidaysPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppContext();
  const [isClient, setIsClient] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const itemsPerPage = 12;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    type: "public",
    description: "",
    isRecurring: false,
    location: "",
    year: new Date().getFullYear(),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch holidays from Firebase
  useEffect(() => {
    if (!currentUser) return;

    const fetchHolidays = async () => {
      try {
        const holidaysSnap = await getDocs(
          query(collection(db, "holidays"), orderBy("date", "asc"))
        );
        const holidaysData: Holiday[] = [];
        holidaysSnap.forEach((doc) => {
          holidaysData.push({ id: doc.id, ...doc.data() } as Holiday);
        });
        setHolidays(holidaysData);
      } catch (error) {
        console.error("Error fetching holidays:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHolidays();

    const unsubscribe = onSnapshot(
      query(collection(db, "holidays"), orderBy("date", "asc")),
      (snapshot) => {
        const holidaysData: Holiday[] = [];
        snapshot.forEach((doc) => {
          holidaysData.push({ id: doc.id, ...doc.data() } as Holiday);
        });
        setHolidays(holidaysData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Generate Mozambican holidays
  const generateMozambicanHolidays = async () => {
    if (!currentUser) return;

    setGenerating(true);
    try {
      const year = selectedYear;
      const mozambicanHolidays = getMozambicanHolidaysForYear(year);

      const existingHolidays = holidays.filter(h => {
        const holidayYear = new Date(h.date).getFullYear();
        return holidayYear === year;
      });

      if (existingHolidays.length > 0) {
        const confirm = window.confirm(
          `You already have ${existingHolidays.length} holidays for ${year}. Do you want to replace them with Mozambican public holidays?`
        );
        if (!confirm) {
          setGenerating(false);
          return;
        }

        const batch = writeBatch(db);
        existingHolidays.forEach((holiday) => {
          batch.delete(doc(db, "holidays", holiday.id));
        });
        await batch.commit();
      }

      const batch = writeBatch(db);
      mozambicanHolidays.forEach((holiday) => {
        const docRef = doc(collection(db, "holidays"));
        batch.set(docRef, {
          ...holiday,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
      await batch.commit();

      alert(`✅ Successfully added ${mozambicanHolidays.length} Mozambican holidays for ${year}!`);
    } catch (error) {
      console.error("Error generating holidays:", error);
      alert("Failed to generate holidays. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  // Filter holidays
  const filteredHolidays = useMemo(() => {
    let filtered = holidays;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.name.toLowerCase().includes(term) ||
          h.description?.toLowerCase().includes(term) ||
          h.location?.toLowerCase().includes(term)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((h) => h.type === filterType);
    }

    if (filterYear !== 0) {
      filtered = filtered.filter((h) => {
        const year = new Date(h.date).getFullYear();
        return year === filterYear;
      });
    }

    return filtered;
  }, [holidays, searchTerm, filterType, filterYear]);

  // ✅ Click handler for stat cards
  const handleStatClick = (type: string | null, year: number | null) => {
    setSearchTerm("");
    setFilterType(type || "all");
    setFilterYear(year || 0);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredHolidays.length / itemsPerPage);
  const paginatedHolidays = filteredHolidays.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique types
  const types = useMemo(() => {
    const typeSet = new Set(holidays.map((h) => h.type).filter(Boolean));
    return ["all", ...Array.from(typeSet)];
  }, [holidays]);

  // Get available years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    holidays.forEach((h) => {
      if (h.date) {
        years.add(new Date(h.date).getFullYear());
      }
    });
    return Array.from(years).sort();
  }, [holidays]);

  // ✅ Stats with counts
  const stats = useMemo(() => {
    const total = holidays.length;
    const publicCount = holidays.filter(h => h.type === "public").length;
    const nationalCount = holidays.filter(h => h.type === "national").length;
    const thisYearCount = holidays.filter(h => {
      const year = new Date(h.date).getFullYear();
      return year === new Date().getFullYear();
    }).length;
    return { total, public: publicCount, national: nationalCount, thisYear: thisYearCount };
  }, [holidays]);

  // Get type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "public":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Public</Badge>;
      case "company":
        return <Badge className="bg-green-500 hover:bg-green-600">Company</Badge>;
      case "religious":
        return <Badge className="bg-purple-500 hover:bg-purple-600">Religious</Badge>;
      case "national":
        return <Badge className="bg-red-500 hover:bg-red-600">National</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "public":
        return <Gift className="h-4 w-4 text-blue-500" />;
      case "company":
        return <Building2 className="h-4 w-4 text-green-500" />;
      case "religious":
        return <Star className="h-4 w-4 text-purple-500" />;
      case "national":
        return <MapPin className="h-4 w-4 text-red-500" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get month name
  const getMonthName = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", { month: "long" });
  };

  // Group holidays by month
  const holidaysByMonth = useMemo(() => {
    const grouped: Record<string, Holiday[]> = {};
    filteredHolidays.forEach((holiday) => {
      const month = getMonthName(holiday.date);
      if (!grouped[month]) {
        grouped[month] = [];
      }
      grouped[month].push(holiday);
    });
    return grouped;
  }, [filteredHolidays]);

  // Handle add holiday
  const handleAddHoliday = async () => {
    setSaving(true);
    try {
      const newHoliday = {
        name: formData.name,
        date: formData.date,
        type: formData.type,
        description: formData.description || "",
        isRecurring: formData.isRecurring || false,
        location: formData.location || "",
        year: new Date(formData.date).getFullYear(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = doc(collection(db, "holidays"));
      await setDoc(docRef, newHoliday);

      setShowAddModal(false);
      resetForm();
      alert("Holiday added successfully!");
    } catch (error) {
      console.error("Error adding holiday:", error);
      alert("Failed to add holiday. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle edit holiday
  const handleEditHoliday = async () => {
    if (!selectedHoliday) return;
    setSaving(true);
    try {
      const updates = {
        name: formData.name,
        date: formData.date,
        type: formData.type,
        description: formData.description || "",
        isRecurring: formData.isRecurring || false,
        location: formData.location || "",
        year: new Date(formData.date).getFullYear(),
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, "holidays", selectedHoliday.id), updates);

      setShowEditModal(false);
      setSelectedHoliday(null);
      resetForm();
      alert("Holiday updated successfully!");
    } catch (error) {
      console.error("Error updating holiday:", error);
      alert("Failed to update holiday. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete holiday
  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "holidays", id));
      alert("Holiday deleted successfully!");
    } catch (error) {
      console.error("Error deleting holiday:", error);
      alert("Failed to delete holiday. Please try again.");
    }
  };

  // Open edit modal
  const openEditModal = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setFormData({
      name: holiday.name || "",
      date: holiday.date || "",
      type: holiday.type || "public",
      description: holiday.description || "",
      isRecurring: holiday.isRecurring || false,
      location: holiday.location || "",
      year: holiday.year || new Date().getFullYear(),
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      date: "",
      type: "public",
      description: "",
      isRecurring: false,
      location: "",
      year: new Date().getFullYear(),
    });
  };

  // Check if user has HR access
  const isHRAccess = currentUser?.role === "hr_admin" || currentUser?.role === "HR_ADMIN";

  // ✅ Check if a filter is active
  const hasActiveFilter = searchTerm || filterType !== "all" || filterYear !== 0;

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    router.push("/login");
    return null;
  }

  if (!isHRAccess) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto p-6">
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-red-500 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
              <p className="text-muted-foreground">
                You don't have permission to manage holidays.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <CalendarDays className="h-8 w-8 text-primary" />
                  Holiday Management
                </h1>
                <p className="text-muted-foreground">
                  Manage public holidays and company observances
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
                  onClick={generateMozambicanHolidays}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {generating ? "Generating..." : `Load ${selectedYear} Holidays`}
                </Button>
                <Button
                  className="gap-2 bg-primary"
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add Holiday
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/hr/dashboard")}
                >
                  Back
                </Button>
              </div>
            </div>

            {/* ✅ Clickable Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card 
                className={`cursor-pointer hover:shadow-lg transition-all hover:scale-105 ${
                  filterType === "all" && filterYear === 0 ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => handleStatClick(null, null)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Holidays</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer hover:shadow-lg transition-all hover:scale-105 ${
                  filterType === "public" ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => handleStatClick("public", null)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Public</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.public}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Gift className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer hover:shadow-lg transition-all hover:scale-105 ${
                  filterType === "national" ? "ring-2 ring-red-500" : ""
                }`}
                onClick={() => handleStatClick("national", null)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">National</p>
                      <p className="text-2xl font-bold text-red-600">{stats.national}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer hover:shadow-lg transition-all hover:scale-105 ${
                  filterYear === new Date().getFullYear() ? "ring-2 ring-purple-500" : ""
                }`}
                onClick={() => handleStatClick(null, new Date().getFullYear())}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">This Year</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.thisYear}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Filter Indicator */}
            {hasActiveFilter && (
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <span>Filtered by:</span>
                {filterType !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setFilterType("all")}
                    />
                  </Badge>
                )}
                {filterYear !== 0 && (
                  <Badge variant="secondary" className="gap-1">
                    {filterYear}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setFilterYear(0)}
                    />
                  </Badge>
                )}
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    "{searchTerm}"
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => setSearchTerm("")}
                    />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterType("all");
                    setFilterYear(0);
                  }}
                  className="h-6 text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search holidays..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="all">All Types</option>
                  {types.filter(t => t !== "all").map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="px-3 py-2 border rounded-lg bg-background"
                >
                  <option value={0}>All Years</option>
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {hasActiveFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterType("all");
                      setFilterYear(0);
                    }}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Holiday Cards Grid */}
            {filteredHolidays.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No holidays found</h3>
                  <p className="text-muted-foreground">
                    {hasActiveFilter
                      ? "Try adjusting your filters"
                      : `Click "Load ${new Date().getFullYear()} Holidays" to add Mozambican public holidays`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-8">
                  {Object.entries(holidaysByMonth).map(([month, monthHolidays]) => (
                    <div key={month}>
                      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        {month} {monthHolidays[0]?.year || ""}
                        <Badge variant="outline" className="ml-2">
                          {monthHolidays.length} {monthHolidays.length === 1 ? "holiday" : "holidays"}
                        </Badge>
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {monthHolidays.map((holiday) => (
                          <Card key={holiday.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="pt-5">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(holiday.date)}
                                    </p>
                                    <h3 className="font-semibold text-base mt-1 leading-tight">
                                      {holiday.name}
                                    </h3>
                                  </div>
                                  {getTypeBadge(holiday.type)}
                                </div>
                                
                                {holiday.description && (
                                  <p className="text-xs text-muted-foreground italic">
                                    {holiday.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center justify-between mt-1 pt-2 border-t">
                                  <div className="flex items-center gap-1.5">
                                    {getTypeIcon(holiday.type)}
                                    <span className="text-xs text-muted-foreground capitalize">
                                      {holiday.type}
                                    </span>
                                  </div>
                                  {holiday.location && (
                                    <span className="text-xs text-muted-foreground">
                                      📍 {holiday.location}
                                    </span>
                                  )}
                                </div>

                                <div className="flex gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditModal(holiday)}
                                    className="flex-1 gap-1 text-xs h-8"
                                  >
                                    <Edit className="h-3 w-3" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteHoliday(holiday.id, holiday.name)}
                                    className="gap-1 text-xs h-8"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, filteredHolidays.length)} of{" "}
                      {filteredHolidays.length} holidays
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Add Holiday</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Holiday Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Christmas Day"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Holiday Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="public">Public</option>
                  <option value="national">National</option>
                  <option value="religious">Religious</option>
                  <option value="company">Company</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Mozambique"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Recurring annually
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button
                onClick={handleAddHoliday}
                disabled={saving || !formData.name || !formData.date}
                className="flex-1"
              >
                {saving ? "Adding..." : "Add Holiday"}
                <Save className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Holiday Modal */}
      {showEditModal && selectedHoliday && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Edit Holiday</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedHoliday(null);
                  resetForm();
                }}
              >
                ✕
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Holiday Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Christmas Day"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Holiday Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="public">Public</option>
                  <option value="national">National</option>
                  <option value="religious">Religious</option>
                  <option value="company">Company</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Mozambique"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="h-4 w-4"
                  />
                  Recurring annually
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t">
              <Button
                onClick={handleEditHoliday}
                disabled={saving || !formData.name || !formData.date}
                className="flex-1"
              >
                {saving ? "Saving..." : "Save Changes"}
                <Save className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedHoliday(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText } from "lucide-react";
import { AssignedCompaniesTable } from "./components/assigned-companies-table";
import { AssignedCompany } from "@/lib/schemas/assigned_company";
import { UploadNdaDialog } from "./components/upload-nda-dialog";
import { ViewDocumentsDialog } from "./components/view-documents-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AssignedCompaniesPage() {
  const [data, setData] = useState<AssignedCompany[]>([]);
  const [filteredData, setFilteredData] = useState<AssignedCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<any | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AssignedCompany | null>(null);
  const [viewDocumentsDialogOpen, setViewDocumentsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AssignedCompany | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  // Función para cargar los datos
  const loadData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const response = await fetch("/api/assigned_companies?onlyActive=true");
      if (!response.ok) {
        throw new Error("Error al cargar los datos");
      }
      
      const responseData = await response.json();
      
      // Asegurarse de que tenemos un array de items y filtrar los eliminados
      const items = responseData.items || [];
      const filteredItems = items.filter((item: AssignedCompany) => !item.isDeleted);
      
      setData(filteredItems);
      setFilteredData(filteredItems);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(data);
    } else {
      const lowercasedFilter = searchTerm.toLowerCase();
      const filtered = data.filter((item) => {
        const companyName = item.Company?.companyName?.toLowerCase() || item.Company?.comercialName?.toLowerCase() || "";
        const projectTitle = item.ProjectRequest?.title?.toLowerCase() || "";
        const clientName = item.ProjectRequest?.Client?.name?.toLowerCase() || "";
        const areaName = item.ProjectRequest?.ClientArea?.areaName?.toLowerCase() || "";
        
        return (
          companyName.includes(lowercasedFilter) ||
          projectTitle.includes(lowercasedFilter) ||
          clientName.includes(lowercasedFilter) ||
          areaName.includes(lowercasedFilter)
        );
      });
      setFilteredData(filtered);
    }
  }, [searchTerm, data]);

  const handleRowClick = (item: AssignedCompany) => {
    if (expandedId === item.id) {
      setExpandedId(null);
      setSelectedRequestDetails(null);
    } else {
      setExpandedId(item.id);
      setSelectedRequestDetails(item.ProjectRequest || null);
    }
  };

  const handleUploadNda = (item: AssignedCompany) => {
    setSelectedItem(item);
    setUploadDialogOpen(true);
  };

  const handleViewDocuments = (item: AssignedCompany) => {
    setSelectedItem(item);
    setViewDocumentsDialogOpen(true);
  };

  const handleDeleteItem = (item: AssignedCompany) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const response = await fetch(`/api/assigned_companies/${itemToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar el elemento");
      }

      // Recargar los datos sin mostrar el indicador de carga
      loadData(false);
      
      // Cerrar el diálogo y limpiar el estado
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      
      // Si el elemento eliminado estaba expandido, cerrarlo
      if (expandedId === itemToDelete.id) {
        setExpandedId(null);
        setSelectedRequestDetails(null);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">Solicitudes Asignadas</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nueva Asignación
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Solicitudes Asignadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar solicitudes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-active"
                checked={showOnlyActive}
                onCheckedChange={setShowOnlyActive}
              />
              <Label htmlFor="show-active">Mostrar activos</Label>
            </div>
          </div>

          <AssignedCompaniesTable
            data={filteredData}
            loading={loading}
            expandedId={expandedId}
            onRowClick={handleRowClick}
            onUploadNda={handleUploadNda}
            onViewDocuments={handleViewDocuments}
            onDeleteItem={handleDeleteItem}
          />
        </CardContent>
      </Card>

      {selectedItem && (
        <UploadNdaDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          item={selectedItem}
          onSuccess={() => {
            loadData(false);
            setUploadDialogOpen(false);
          }}
        />
      )}

      {selectedItem && (
        <ViewDocumentsDialog
          open={viewDocumentsDialogOpen}
          onOpenChange={setViewDocumentsDialogOpen}
          item={selectedItem}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la asignación
              {itemToDelete && (
                <span className="font-semibold">
                  {" "}"{itemToDelete.Company?.companyName || "Empresa"}" para el proyecto "{itemToDelete.ProjectRequest?.title || "Solicitud"}"
                </span>
              )}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

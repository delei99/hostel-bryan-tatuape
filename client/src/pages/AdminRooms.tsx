import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Edit2, Save, X, Plus } from "lucide-react";

export default function AdminRooms() {
  const { data: rooms = [], isLoading, refetch } = trpc.rooms.list.useQuery();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState<any>({
    name: "",
    type: "private",
    capacity: 1,
    pricePerNight: 0,
    description: "",
    amenities: "",
    status: "available",
  });

  const updateRoomMutation = trpc.rooms.update.useMutation({
    onSuccess: () => {
      toast.success("Quarto atualizado com sucesso!");
      setEditingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const createRoomMutation = trpc.rooms.create.useMutation({
    onSuccess: () => {
      toast.success("Quarto criado com sucesso!");
      setShowCreateModal(false);
      setCreateFormData({
        name: "",
        type: "private",
        capacity: 1,
        pricePerNight: 0,
        description: "",
        amenities: "",
        status: "available",
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleEdit = (room: any) => {
    setEditingId(room.id);
    setEditFormData({ ...room });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const handleSave = () => {
    if (!editFormData) return;

    updateRoomMutation.mutate({
      id: editFormData.id,
      name: editFormData.name,
      description: editFormData.description,
      pricePerNight: parseInt(editFormData.pricePerNight),
      capacity: parseInt(editFormData.capacity),
      type: editFormData.type,
      amenities: editFormData.amenities,
      status: editFormData.status,
    });
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateFieldChange = (field: string, value: any) => {
    setCreateFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateRoom = () => {
    if (!createFormData.name) {
      toast.error("Nome do quarto é obrigatório");
      return;
    }
    createRoomMutation.mutate({
      name: createFormData.name,
      type: createFormData.type,
      capacity: parseInt(createFormData.capacity),
      pricePerNight: Math.round(parseFloat(createFormData.pricePerNight) * 100),
      description: createFormData.description || undefined,
      amenities: createFormData.amenities || undefined,
      status: createFormData.status,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <p className="text-gray-500">Carregando quartos...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gerenciar Quartos</h1>
            <p className="text-gray-600 mt-2">Edite os detalhes dos quartos do hostel</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4" />
            Criar Novo Quarto
          </Button>
        </div>

        {showCreateModal && (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Criar Novo Quarto</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Quarto *</Label>
                  <Input
                    value={createFormData.name}
                    onChange={(e) => handleCreateFieldChange("name", e.target.value)}
                    placeholder="Ex: Quarto 101"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={createFormData.type} onValueChange={(value) => handleCreateFieldChange("type", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Privado</SelectItem>
                      <SelectItem value="shared">Compartilhado</SelectItem>
                      <SelectItem value="dorm">Dormitório</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Capacidade</Label>
                  <Input
                    type="number"
                    value={createFormData.capacity}
                    onChange={(e) => handleCreateFieldChange("capacity", e.target.value)}
                    min="1"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Preço por Noite (R$)</Label>
                  <Input
                    type="number"
                    value={createFormData.pricePerNight}
                    onChange={(e) => handleCreateFieldChange("pricePerNight", e.target.value)}
                    min="0"
                    step="0.01"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => handleCreateFieldChange("description", e.target.value)}
                  placeholder="Descrição do quarto"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <Label>Comodidades (separadas por vírgula)</Label>
                <textarea
                  value={createFormData.amenities}
                  onChange={(e) => handleCreateFieldChange("amenities", e.target.value)}
                  placeholder="Ex: WiFi, TV, Ar condicionado"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              <div>
                <Label>Status</Label>
                <Select value={createFormData.status} onValueChange={(value) => handleCreateFieldChange("status", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="maintenance">Manutenção</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateRoom} disabled={createRoomMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {createRoomMutation.isPending ? "Criando..." : "Criar Quarto"}
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-4">
          {rooms.map((room: any) => (
            <Card key={room.id} className="p-6">
              {editingId === room.id ? (
                // Modo de edição
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Nome do Quarto</Label>
                      <Input
                        value={editFormData?.name || ""}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Tipo</Label>
                      <Select value={editFormData?.type || ""} onValueChange={(value) => handleFieldChange("type", value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Privado</SelectItem>
                          <SelectItem value="shared">Compartilhado</SelectItem>
                          <SelectItem value="dorm">Dormitório</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Preço por Noite (R$)</Label>
                      <Input
                        type="number"
                        value={editFormData?.pricePerNight ? editFormData.pricePerNight / 100 : ""}
                        onChange={(e) => handleFieldChange("pricePerNight", Math.round(parseFloat(e.target.value) * 100))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Capacidade (pessoas)</Label>
                      <Input
                        type="number"
                        value={editFormData?.capacity || ""}
                        onChange={(e) => handleFieldChange("capacity", parseInt(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Descrição</Label>
                    <textarea
                      value={editFormData?.description || ""}
                      onChange={(e) => handleFieldChange("description", e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Comodidades (separadas por vírgula)</Label>
                    <textarea
                      value={editFormData?.amenities || ""}
                      onChange={(e) => handleFieldChange("amenities", e.target.value)}
                      className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Ex: WiFi, Ar condicionado, Frigobar"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Select value={editFormData?.status || ""} onValueChange={(value) => handleFieldChange("status", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponível</SelectItem>
                        <SelectItem value="maintenance">Manutenção</SelectItem>
                        <SelectItem value="archived">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={updateRoomMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {updateRoomMutation.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              ) : (
                // Modo de visualização
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-gray-600">Tipo:</span>
                        <p className="font-medium">{room.type === "private" ? "Privado" : room.type === "shared" ? "Compartilhado" : "Dormitório"}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Preço:</span>
                        <p className="font-medium">R$ {(room.pricePerNight / 100).toFixed(2)}/noite</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Capacidade:</span>
                        <p className="font-medium">{room.capacity} pessoa{room.capacity > 1 ? "s" : ""}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <p className="font-medium">
                          {room.status === "available" ? "✅ Disponível" : room.status === "maintenance" ? "🔧 Manutenção" : "📦 Arquivado"}
                        </p>
                      </div>
                    </div>
                    {room.description && (
                      <div className="mt-4">
                        <span className="text-gray-600 text-sm">Descrição:</span>
                        <p className="text-gray-700 text-sm mt-1">{room.description}</p>
                      </div>
                    )}
                    {room.amenities && (
                      <div className="mt-4">
                        <span className="text-gray-600 text-sm">Comodidades:</span>
                        <p className="text-gray-700 text-sm mt-1">{room.amenities}</p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleEdit(room)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 ml-4"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>

        {rooms.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">Nenhum quarto encontrado. Clique em "Criar Novo Quarto" para começar!</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

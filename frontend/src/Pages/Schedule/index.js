import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Calendar, Badge, Tag, Button, Modal, Input, DatePicker, Select, Empty, Grid, message, Popconfirm } from "antd";
import {
  CalendarOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import Backend from "../../Backend";
import * as jobService from "../Jobs/services/jobService";

const { TextArea } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

// Schedule event API
const eventService = {
  getAll: () => Backend.get("api/schedule-events"),
  create: (data) => Backend.post("api/schedule-events", data),
  update: (id, data) => Backend.put(`api/schedule-events/${id}`, data),
  delete: (id) => Backend.delete(`api/schedule-events/${id}`),
};

const SchedulePage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const queryClient = useQueryClient();
  const [view, setView] = useState("list");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: "", eventDate: dayjs(), eventTime: "", notes: "", color: "blue" });

  // Fetch all jobs
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ["jobs", "schedule"],
    queryFn: () => jobService.getJobsList({ pageSize: 500 }),
  });

  // Fetch custom events
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["schedule-events"],
    queryFn: eventService.getAll,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: eventService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-events"] });
      message.success("Event added");
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => eventService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-events"] });
      message.success("Event updated");
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: eventService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-events"] });
      message.success("Event deleted");
    },
  });

  // Update job date mutation
  const updateJobDateMutation = useMutation({
    mutationFn: ({ id, startDate }) => jobService.updateJob(id, { startDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      message.success("Job date updated");
    },
    onError: () => {
      message.error("Failed to update job date");
    },
  });

  const jobs = useMemo(() => {
    if (!jobsData) return [];
    return Array.isArray(jobsData) ? jobsData : (jobsData.jobs || []);
  }, [jobsData]);

  const events = useMemo(() => {
    if (!eventsData) return [];
    return Array.isArray(eventsData) ? eventsData : [];
  }, [eventsData]);

  // Combine jobs and events into schedule items
  const scheduleItems = useMemo(() => {
    const items = [];

    jobs.forEach((job) => {
      if (job.startDate) {
        items.push({
          id: `job-${job.id}`,
          jobId: job.id,
          type: "job",
          title: job.title,
          date: job.startDate,
          endDate: job.endDate,
          status: job.status,
          customer: job.customer?.name || "",
          address: job.workSiteAddress,
          color: job.status === "COMPLETED" ? "green" : job.status === "CANCELLED" ? "red" : "blue",
        });
      }
    });

    events.forEach((event) => {
      items.push({
        id: `event-${event.id}`,
        eventId: event.id,
        type: "event",
        title: event.title,
        date: event.eventDate,
        time: event.eventTime,
        notes: event.notes,
        color: event.color || "purple",
      });
    });

    items.sort((a, b) => new Date(a.date) - new Date(b.date));
    return items;
  }, [jobs, events]);

  const getItemsForDate = useCallback((date) => {
    const dateStr = dayjs(date).format("YYYY-MM-DD");
    return scheduleItems.filter((item) => item.date === dateStr);
  }, [scheduleItems]);

  const upcomingItems = useMemo(() => {
    const today = dayjs().format("YYYY-MM-DD");
    return scheduleItems.filter((item) => item.date >= today);
  }, [scheduleItems]);

  const pastItems = useMemo(() => {
    const today = dayjs().format("YYYY-MM-DD");
    return scheduleItems.filter((item) => item.date < today);
  }, [scheduleItems]);

  const handleSaveEvent = () => {
    if (!newEvent.title.trim()) {
      message.error("Event title is required");
      return;
    }
    const data = {
      title: newEvent.title.trim(),
      eventDate: newEvent.eventDate.format("YYYY-MM-DD"),
      eventTime: newEvent.eventTime || null,
      notes: newEvent.notes || null,
      color: newEvent.color,
    };

    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.eventId, data });
    } else {
      createEventMutation.mutate(data);
    }
    setEventModalVisible(false);
    setEditingEvent(null);
    setNewEvent({ title: "", eventDate: dayjs(), eventTime: "", notes: "", color: "blue" });
  };

  const handleEditEvent = (item) => {
    setEditingEvent(item);
    setNewEvent({
      title: item.title,
      eventDate: dayjs(item.date),
      eventTime: item.time || "",
      notes: item.notes || "",
      color: item.color || "blue",
    });
    setEventModalVisible(true);
  };

  const handleDeleteEvent = (eventId) => {
    deleteEventMutation.mutate(eventId);
  };

  // Handle changing a job's start date
  const [jobDateModal, setJobDateModal] = useState(null);
  const [newJobDate, setNewJobDate] = useState(null);

  const handleChangeJobDate = (item) => {
    setJobDateModal(item);
    setNewJobDate(dayjs(item.date));
  };

  const handleSaveJobDate = () => {
    if (jobDateModal && newJobDate) {
      updateJobDateMutation.mutate({
        id: jobDateModal.jobId,
        startDate: newJobDate.format("YYYY-MM-DD"),
      });
    }
    setJobDateModal(null);
    setNewJobDate(null);
  };

  const statusColor = (status) => {
    switch (status) {
      case "COMPLETED": return "success";
      case "IN_PROGRESS": return "processing";
      case "CANCELLED": return "error";
      default: return "default";
    }
  };

  const dateCellRender = (value) => {
    const items = getItemsForDate(value);
    if (items.length === 0) return null;
    return (
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {items.slice(0, isMobile ? 1 : 3).map((item) => (
          <li key={item.id} style={{ marginBottom: 2 }}>
            <Badge
              color={item.color}
              text={isMobile ? "" : <span style={{ fontSize: "10px" }}>{item.title}</span>}
            />
          </li>
        ))}
        {items.length > (isMobile ? 1 : 3) && (
          <li style={{ fontSize: "10px", color: "#999" }}>+{items.length - (isMobile ? 1 : 3)} more</li>
        )}
      </ul>
    );
  };

  const renderListItem = (item) => (
    <div
      key={item.id}
      style={{
        padding: isMobile ? "10px 12px" : "12px 16px",
        borderLeft: `4px solid ${item.color === "green" ? "#52c41a" : item.color === "red" ? "#ff4d4f" : item.color === "purple" ? "#722ed1" : item.color === "orange" ? "#fa8c16" : "#1890ff"}`,
        background: "#fff",
        borderRadius: "4px",
        marginBottom: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: "600", fontSize: isMobile ? "13px" : "14px", marginBottom: "4px" }}>
            {item.title}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "12px", color: "#666" }}>
            <span><CalendarOutlined style={{ marginRight: 4 }} />{dayjs(item.date).format("MMM D, YYYY")}</span>
            {item.time && <span><ClockCircleOutlined style={{ marginRight: 4 }} />{item.time}</span>}
            {item.customer && item.type === "job" && <span><UserOutlined style={{ marginRight: 4 }} />{item.customer}</span>}
            {item.address && <span><EnvironmentOutlined style={{ marginRight: 4 }} />{item.address}</span>}
          </div>
          {item.notes && <div style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>{item.notes}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          {item.type === "job" && (
            <>
              <Tag color={statusColor(item.status)} style={{ margin: 0 }}>{item.status?.replace("_", " ")}</Tag>
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleChangeJobDate(item)} title="Change date" />
            </>
          )}
          {item.type === "event" && (
            <>
              <Tag color="purple" style={{ margin: 0 }}>Event</Tag>
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEditEvent(item)} />
              <Popconfirm title="Delete this event?" onConfirm={() => handleDeleteEvent(item.eventId)} okText="Delete" cancelText="Cancel">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const isLoading = jobsLoading || eventsLoading;

  return (
    <div>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        flexWrap: "wrap",
        gap: "8px",
      }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? "20px" : "24px", fontWeight: "700", color: "#1f2937" }}>
          <CalendarOutlined style={{ marginRight: 8 }} />Schedule
        </h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            type={view === "list" ? "primary" : "default"}
            icon={<UnorderedListOutlined />}
            onClick={() => setView("list")}
          >
            {!isMobile && "List"}
          </Button>
          <Button
            type={view === "calendar" ? "primary" : "default"}
            icon={<CalendarOutlined />}
            onClick={() => setView("calendar")}
          >
            {!isMobile && "Calendar"}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingEvent(null);
              setNewEvent({ title: "", eventDate: dayjs(), eventTime: "", notes: "", color: "blue" });
              setEventModalVisible(true);
            }}
            style={{ background: "#1f2937" }}
          >
            {!isMobile && "Add Event"}
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {view === "calendar" && (
        <Card size="small" loading={isLoading}>
          <Calendar
            value={selectedDate}
            onSelect={setSelectedDate}
            cellRender={(current, info) => {
              if (info.type === "date") return dateCellRender(current);
              return null;
            }}
            fullscreen={!isMobile}
          />
          {getItemsForDate(selectedDate).length > 0 && (
            <div style={{ marginTop: "16px", borderTop: "1px solid #f0f0f0", paddingTop: "16px" }}>
              <h4 style={{ marginBottom: "8px", color: "#666", fontSize: "12px", textTransform: "uppercase" }}>
                {dayjs(selectedDate).format("MMMM D, YYYY")}
              </h4>
              {getItemsForDate(selectedDate).map(renderListItem)}
            </div>
          )}
        </Card>
      )}

      {/* List View */}
      {view === "list" && (
        <div>
          <Card
            size="small"
            title={<span style={{ fontSize: "14px", fontWeight: "600" }}>Upcoming ({upcomingItems.length})</span>}
            style={{ marginBottom: "16px" }}
            loading={isLoading}
          >
            {upcomingItems.length > 0 ? (
              upcomingItems.map(renderListItem)
            ) : (
              <Empty description="No upcoming jobs or events" />
            )}
          </Card>

          {pastItems.length > 0 && (
            <Card
              size="small"
              title={<span style={{ fontSize: "14px", fontWeight: "600", color: "#999" }}>Past ({pastItems.length})</span>}
              loading={isLoading}
            >
              {pastItems.slice(-10).reverse().map(renderListItem)}
              {pastItems.length > 10 && (
                <div style={{ textAlign: "center", padding: "8px", color: "#999", fontSize: "12px" }}>
                  Showing last 10 of {pastItems.length} past items
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Add/Edit Event Modal */}
      <Modal
        title={editingEvent ? "Edit Event" : "Add Event"}
        open={eventModalVisible}
        onOk={handleSaveEvent}
        onCancel={() => { setEventModalVisible(false); setEditingEvent(null); }}
        okText={editingEvent ? "Save" : "Add Event"}
        okButtonProps={{ style: { background: "#1f2937" } }}
        confirmLoading={createEventMutation.isPending || updateEventMutation.isPending}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#666", marginBottom: "4px" }}>
              Event Title *
            </label>
            <Input
              placeholder="Enter event title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#666", marginBottom: "4px" }}>
                Date *
              </label>
              <DatePicker
                value={newEvent.eventDate}
                onChange={(date) => setNewEvent({ ...newEvent, eventDate: date || dayjs() })}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#666", marginBottom: "4px" }}>
                Time
              </label>
              <Input
                placeholder="e.g. 9:00 AM"
                value={newEvent.eventTime}
                onChange={(e) => setNewEvent({ ...newEvent, eventTime: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#666", marginBottom: "4px" }}>
              Color
            </label>
            <Select
              value={newEvent.color}
              onChange={(val) => setNewEvent({ ...newEvent, color: val })}
              style={{ width: "100%" }}
            >
              <Option value="blue"><Badge color="blue" text="Blue" /></Option>
              <Option value="green"><Badge color="green" text="Green" /></Option>
              <Option value="red"><Badge color="red" text="Red" /></Option>
              <Option value="purple"><Badge color="purple" text="Purple" /></Option>
              <Option value="orange"><Badge color="orange" text="Orange" /></Option>
            </Select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#666", marginBottom: "4px" }}>
              Notes
            </label>
            <TextArea
              rows={3}
              placeholder="Add notes..."
              value={newEvent.notes}
              onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Change Job Date Modal */}
      <Modal
        title={`Change Date: ${jobDateModal?.title || ""}`}
        open={!!jobDateModal}
        onOk={handleSaveJobDate}
        onCancel={() => { setJobDateModal(null); setNewJobDate(null); }}
        okText="Save Date"
        okButtonProps={{ style: { background: "#1f2937" } }}
        confirmLoading={updateJobDateMutation.isPending}
      >
        <div style={{ padding: "12px 0" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "500", color: "#666", marginBottom: "8px" }}>
            New Start Date
          </label>
          <DatePicker
            value={newJobDate}
            onChange={(date) => setNewJobDate(date)}
            style={{ width: "100%" }}
            size="large"
          />
        </div>
      </Modal>
    </div>
  );
};

export default SchedulePage;

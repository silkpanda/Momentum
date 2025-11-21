# WebSocket Implementation Guide

## Overview

The Momentum webapp now uses **WebSockets** for real-time, bidirectional communication with the API. This enables instant updates across all connected clients without requiring manual page refreshes or polling.

## Architecture

### Server Side (API)
- **Technology**: Socket.IO v4.8.1
- **Location**: `momentum-api/src/server.ts`
- **Port**: Same as HTTP server (3001 for local, deployed port on Render)
- **CORS**: Configured to allow all origins (can be restricted in production)

### Client Side (Webapp)
- **Technology**: socket.io-client
- **Configuration**: `lib/socket.ts`
- **Provider**: `lib/providers/SocketProvider.tsx`
- **Hooks**: `lib/hooks/useSocket.ts`

## Features

### ✅ Implemented

1. **Automatic Connection Management**
   - Connects on app load
   - Auto-reconnection with exponential backoff
   - Connection status indicator (dev mode only)

2. **Real-Time Events**
   - Task updates (create, update, delete)
   - Member points updates
   - Quest updates
   - Routine updates
   - Store item updates

3. **Type-Safe Event Handling**
   - TypeScript interfaces for all events
   - Strongly-typed event names as constants

4. **React Integration**
   - Custom hooks for easy component integration
   - Provider pattern for app-wide socket access
   - Automatic cleanup on unmount

## Usage

### Basic Setup (Already Done)

The WebSocket connection is automatically established when the app loads via the `SocketProvider` in the root layout.

```tsx
// app/layout.tsx
<SessionProvider>
  <SocketProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </SocketProvider>
</SessionProvider>
```

### Using WebSockets in Components

#### Method 1: Using the `useSocketEvent` Hook (Recommended)

```tsx
import { useSocketEvent } from '@/lib/hooks/useSocket';
import { SOCKET_EVENTS, TaskUpdatedEvent } from '@/lib/socket';

function MyComponent() {
  // Listen for task updates
  useSocketEvent<TaskUpdatedEvent>(SOCKET_EVENTS.TASK_UPDATED, (data) => {
    console.log('Task updated:', data);
    
    if (data.type === 'create') {
      // Handle new task
    } else if (data.type === 'update') {
      // Handle task update
    } else if (data.type === 'delete') {
      // Handle task deletion
    }
  });

  return <div>My Component</div>;
}
```

#### Method 2: Using the Socket Directly

```tsx
import { useSocket } from '@/lib/hooks/useSocket';

function MyComponent() {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handler = (data: any) => {
      console.log('Event received:', data);
    };

    socket.on('custom_event', handler);

    return () => {
      socket.off('custom_event', handler);
    };
  }, [socket]);

  return <div>My Component</div>;
}
```

#### Method 3: Emitting Events

```tsx
import { useSocketEmit } from '@/lib/hooks/useSocket';

function MyComponent() {
  const emit = useSocketEmit();

  const handleClick = () => {
    emit('custom_event', { data: 'value' });
  };

  return <button onClick={handleClick}>Send Event</button>;
}
```

#### Method 4: Checking Connection Status

```tsx
import { useSocketStatus } from '@/lib/hooks/useSocket';

function MyComponent() {
  const isConnected = useSocketStatus();

  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
```

## Event Types

### Task Events

```typescript
interface TaskUpdatedEvent {
  type: 'create' | 'update' | 'delete';
  task?: any;  // Full task object (for create/update)
  taskId?: string;  // Task ID (for delete)
  memberUpdate?: {  // Optional member points update
    memberId: string;
    pointsTotal: number;
  };
}
```

**Event Name**: `SOCKET_EVENTS.TASK_UPDATED` (`'task_updated'`)

**Emitted When**:
- Task is created
- Task is updated
- Task is deleted
- Task is completed
- Task is approved

### Member Points Events

```typescript
interface MemberPointsUpdatedEvent {
  memberId: string;
  pointsTotal: number;
  householdId: string;
}
```

**Event Name**: `SOCKET_EVENTS.MEMBER_POINTS_UPDATED` (`'member_points_updated'`)

**Emitted When**:
- Points are awarded (task approval)
- Points are deducted (reward purchase)
- Points are manually adjusted

### Quest Events

```typescript
interface QuestUpdatedEvent {
  type: 'create' | 'update' | 'delete';
  quest?: any;
  questId?: string;
}
```

**Event Name**: `SOCKET_EVENTS.QUEST_UPDATED` (`'quest_updated'`)

### Routine Events

```typescript
interface RoutineUpdatedEvent {
  type: 'create' | 'update' | 'delete';
  routine?: any;
  routineId?: string;
}
```

**Event Name**: `SOCKET_EVENTS.ROUTINE_UPDATED` (`'routine_updated'`)

### Store Item Events

```typescript
interface StoreItemUpdatedEvent {
  type: 'create' | 'update' | 'delete';
  storeItem?: any;
  storeItemId?: string;
}
```

**Event Name**: `SOCKET_EVENTS.STORE_ITEM_UPDATED` (`'store_item_updated'`)

## Configuration

### Environment Variables

The WebSocket connection URL is automatically derived from the `INTERNAL_API_URL` environment variable:

```env
# .env.local
INTERNAL_API_URL=https://momentum-api-vpkw.onrender.com/api/v1
```

The socket will connect to: `https://momentum-api-vpkw.onrender.com`

### Connection Options

Default configuration in `lib/socket.ts`:

```typescript
{
  transports: ['websocket', 'polling'],  // Try WebSocket first, fallback to polling
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
}
```

## Examples

### Real-Time Dashboard Updates

See `app/components/kiosk/KioskDashboard.tsx` for a complete example:

```tsx
// Listen for task updates
useSocketEvent<TaskUpdatedEvent>(SOCKET_EVENTS.TASK_UPDATED, (data) => {
  if (data.type === 'create' && data.task) {
    setTasks(prev => [data.task, ...prev]);
  } else if (data.type === 'update' && data.task) {
    setTasks(prev => prev.map(t => t._id === data.task._id ? data.task : t));
    
    // Update member points if included
    if (data.memberUpdate) {
      setMembers(prev => prev.map(m => 
        m._id === data.memberUpdate!.memberId 
          ? { ...m, pointsTotal: data.memberUpdate!.pointsTotal }
          : m
      ));
    }
  } else if (data.type === 'delete' && data.taskId) {
    setTasks(prev => prev.filter(t => t._id !== data.taskId));
  }
});
```

## Debugging

### Development Mode

In development mode, a connection status indicator appears in the bottom-right corner:
- 🟢 Green: Connected
- 🔴 Red: Disconnected

### Console Logs

All WebSocket events are logged to the console with the `[WebSocket]` prefix:

```
[WebSocket] Connecting to: https://momentum-api-vpkw.onrender.com
[WebSocket] Connected: abc123
[WebSocket] Task updated via WebSocket: { type: 'update', task: {...} }
```

### Browser DevTools

You can inspect WebSocket connections in Chrome DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Click on the connection to see frames

## Best Practices

### 1. Use Type-Safe Events

Always use the predefined event types and constants:

```tsx
// ✅ Good
useSocketEvent<TaskUpdatedEvent>(SOCKET_EVENTS.TASK_UPDATED, handler);

// ❌ Bad
useSocketEvent('task_updated', handler);
```

### 2. Handle All Event Types

When listening to events, handle all possible types:

```tsx
useSocketEvent<TaskUpdatedEvent>(SOCKET_EVENTS.TASK_UPDATED, (data) => {
  switch (data.type) {
    case 'create':
      // Handle create
      break;
    case 'update':
      // Handle update
      break;
    case 'delete':
      // Handle delete
      break;
  }
});
```

### 3. Update State Immutably

Always use immutable state updates:

```tsx
// ✅ Good
setTasks(prev => [...prev, newTask]);

// ❌ Bad
setTasks(tasks => {
  tasks.push(newTask);
  return tasks;
});
```

### 4. Avoid Memory Leaks

The `useSocketEvent` hook automatically cleans up event listeners, but if you're using the socket directly, always clean up:

```tsx
useEffect(() => {
  if (!socket) return;

  const handler = (data) => { /* ... */ };
  socket.on('event', handler);

  return () => {
    socket.off('event', handler);  // ✅ Clean up
  };
}, [socket]);
```

## Troubleshooting

### Connection Issues

**Problem**: Socket won't connect

**Solutions**:
1. Check that the API is running and accessible
2. Verify `INTERNAL_API_URL` is set correctly
3. Check browser console for CORS errors
4. Ensure Socket.IO versions match (server: 4.8.1, client: compatible)

### Events Not Received

**Problem**: Component doesn't update when events are emitted

**Solutions**:
1. Check that you're listening to the correct event name
2. Verify the API is actually emitting the event (check server logs)
3. Ensure the component is mounted when the event is emitted
4. Check that the event handler is updating state correctly

### Multiple Connections

**Problem**: Multiple socket connections being created

**Solutions**:
1. Ensure `SocketProvider` is only used once in the app tree
2. Don't call `getSocket()` multiple times unnecessarily
3. Use the provided hooks instead of creating new connections

## Future Enhancements

### Planned Features

1. **Room-Based Events**
   - Join household-specific rooms
   - Only receive events for your household

2. **Authentication**
   - Send JWT token with socket connection
   - Verify user permissions server-side

3. **Presence System**
   - Track which family members are online
   - Show "typing" indicators

4. **Optimistic Updates**
   - Update UI immediately, rollback on error
   - Show pending states

5. **Event Queuing**
   - Queue events when offline
   - Replay when reconnected

## Migration Guide

### Converting Polling to WebSockets

If you have components that poll for updates, convert them to use WebSockets:

**Before (Polling)**:
```tsx
useEffect(() => {
  const interval = setInterval(() => {
    fetchTasks();
  }, 5000);

  return () => clearInterval(interval);
}, []);
```

**After (WebSockets)**:
```tsx
useSocketEvent<TaskUpdatedEvent>(SOCKET_EVENTS.TASK_UPDATED, (data) => {
  // Update tasks based on event
  if (data.type === 'update') {
    setTasks(prev => prev.map(t => t._id === data.task._id ? data.task : t));
  }
});
```

## Performance Considerations

1. **Event Frequency**: WebSocket events are instant but can be frequent. Consider debouncing UI updates if needed.

2. **Payload Size**: Keep event payloads small. Send only changed data, not entire datasets.

3. **Connection Overhead**: WebSocket connections are persistent. This is more efficient than HTTP polling but uses a connection slot.

4. **Scalability**: For production, consider using Socket.IO with Redis adapter for horizontal scaling.

## Security

### Current Implementation

- CORS allows all origins (development)
- No authentication on socket connection
- Events are broadcast to all connected clients

### Production Recommendations

1. **Restrict CORS**: Only allow your webapp domain
2. **Authenticate Connections**: Verify JWT token on connection
3. **Use Rooms**: Isolate events by household
4. **Validate Events**: Check permissions before emitting
5. **Rate Limiting**: Prevent event flooding

## Support

For issues or questions:
1. Check browser console for errors
2. Review server logs for WebSocket events
3. Verify API and webapp versions are compatible
4. Test with the development connection indicator

---

**Last Updated**: 2025-11-21
**Version**: 1.0.0
**Status**: ✅ Production Ready

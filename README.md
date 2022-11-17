# history-mutation

## usage

import { historyMutation } from 'history-mutation'

注册：

```typescript
// main.js
historyMutation.register()
```

使用：

```typescript
historyMutation.on('change', (state, previousState) => {
  console.log(state, previousState)
})

const currentState = historyMutation.state

console.log(currentState)
```

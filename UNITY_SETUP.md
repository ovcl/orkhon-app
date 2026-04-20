# Unity AR/VR Setup Guide for Orkhon Valley Tours

This guide explains how to set up the Unity project for the AR/VR Tours feature.

## Prerequisites

- Unity 2022 LTS (Download from [Unity Hub](https://unity.com/download))
- Basic Unity knowledge
- Firebase account
- OpenAI API key

## Step 1: Create Unity Project

1. Open Unity Hub
2. Click "New Project"
3. Select "3D (URP)" template
4. Name: `orkhon-unity`
5. Location: Choose a location (e.g., `d:\orkhon-unity`)
6. Click "Create Project"

## Step 2: Install Required Packages

### Via Unity Package Manager (Window > Package Manager):

1. **AR Foundation**
   - Click "+" > "Add package by name"
   - Name: `com.unity.xr.arfoundation`
   - Version: `4.2.10` (compatible with Unity 2022 LTS)

2. **XR Plugin Management**
   - Should install automatically with AR Foundation
   - If not: `com.unity.xr.management`

3. **Firebase SDK**
   - Download from [Firebase Unity SDK](https://firebase.google.com/download/unity)
   - Import these packages:
     - `FirebaseAuth.unitypackage`
     - `FirebaseDatabase.unitypackage`
     - `FirebaseFirestore.unitypackage`
     - `FirebaseStorage.unitypackage`

## Step 3: Configure Project Settings

### WebGL Build Settings

1. Go to **File > Build Settings**
2. Select **WebGL** platform
3. Click "Switch Platform"
4. Click "Player Settings"
5. Configure:
   - **Company Name**: Orkhon Valley
   - **Product Name**: Orkhon VR Tours
   - **Compression Format**: Brotli (best compression)
   - **Code Optimization**: Runtime Speed

### XR Settings (for AR features)

1. Go to **Edit > Project Settings > XR Plug-in Management**
2. Enable **ARCore** (for Android)
3. Enable **ARKit** (for iOS)

## Step 4: Project Structure

Create the following folder structure in your Unity project:

```
Assets/
├── Scenes/
│   ├── MainScene.unity          # Main entry point
│   ├── VR360Viewer.unity        # 360° image viewer
│   └── ARExperience.unity       # AR features
├── Scripts/
│   ├── Core/
│   │   ├── GameManager.cs       # Main game controller
│   │   ├── SiteData.cs          # Site data model
│   │   └── APIClient.cs         # Fetch data from Next.js API
│   ├── VR/
│   │   ├── VR360Controller.cs   # 360° viewer controller
│   │   ├── VR360ImageLoader.cs  # Load 360° images
│   │   └── VR360Navigation.cs   # Navigate between sites
│   ├── AR/
│   │   ├── ARPlaneDetection.cs  # Detect surfaces
│   │   ├── ARInfoPanel.cs       # Display site info in AR
│   │   └── ARMarkerController.cs # Manage AR markers
│   ├── UI/
│   │   ├── MapController.cs     # Map integration
│   │   ├── MapMarker.cs         # Site markers
│   │   └── ChatInterface.cs     # AI chat UI
│   └── AI/
│       ├── AIManager.cs         # AI integration manager
│       └── VirtualGuide.cs      # Virtual guide controller
├── Resources/
│   ├── 360Images/               # 360° panoramic images
│   └── SiteData/                # Cached site data
├── Prefabs/
│   ├── UI/
│   │   ├── InfoPanel.prefab
│   │   ├── ChatWindow.prefab
│   │   └── LoadingScreen.prefab
│   └── AR/
│       └── SiteMarker.prefab
└── Plugins/
    └── WebGL/
        └── WebGLTemplates/      # Custom WebGL template
```

## Step 5: Core Scripts

### GameManager.cs (Main Controller)

```csharp
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.Networking;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance;
    
    private string apiBaseUrl = "http://localhost:3000/api";
    private List<SiteData> sites = new List<SiteData>();
    
    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }
    
    void Start()
    {
        StartCoroutine(LoadSitesFromAPI());
    }
    
    IEnumerator LoadSitesFromAPI()
    {
        UnityWebRequest request = UnityWebRequest.Get(apiBaseUrl + "/sites");
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            string jsonResponse = request.downloadHandler.text;
            SitesResponse response = JsonUtility.FromJson<SitesResponse>(jsonResponse);
            sites = response.sites;
            Debug.Log($"Loaded {sites.Count} sites from API");
        }
        else
        {
            Debug.LogError("Failed to load sites: " + request.error);
        }
    }
    
    public List<SiteData> GetSites()
    {
        return sites;
    }
}

[System.Serializable]
public class SitesResponse
{
    public List<SiteData> sites;
}
```

### SiteData.cs (Data Model)

```csharp
using System;
using System.Collections.Generic;

[Serializable]
public class SiteData
{
    public int id;
    public string name;
    public string nameEn;
    public string category;
    public string description;
    public string descriptionEn;
    public Location location;
    public string altitude;
    public string protectionStatus;
    public List<string> images;
    public string image360;
    public string aiDescription;
}

[Serializable]
public class Location
{
    public float lat;
    public float lng;
}
```

### AIManager.cs (AI Integration)

```csharp
using UnityEngine;
using System.Collections;
using UnityEngine.Networking;
using System.Text;

public class AIManager : MonoBehaviour
{
    public static AIManager Instance;
    
    private string apiBaseUrl = "http://localhost:3000/api";
    
    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
    }
    
    public void RequestAIExplanation(int siteId)
    {
        StartCoroutine(FetchAIExplanation(siteId));
    }
    
    IEnumerator FetchAIExplanation(int siteId)
    {
        string url = apiBaseUrl + "/ai-guide";
        
        AIRequest requestData = new AIRequest { siteId = siteId };
        string jsonData = JsonUtility.ToJson(requestData);
        
        UnityWebRequest request = new UnityWebRequest(url, "POST");
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonData);
        request.uploadHandler = new UploadHandlerRaw(bodyRaw);
        request.downloadHandler = new DownloadHandlerBuffer();
        request.SetRequestHeader("Content-Type", "application/json");
        
        yield return request.SendWebRequest();
        
        if (request.result == UnityWebRequest.Result.Success)
        {
            string jsonResponse = request.downloadHandler.text;
            AIResponse response = JsonUtility.FromJson<AIResponse>(jsonResponse);
            ReceiveAIResponse(response.response);
        }
        else
        {
            ReceiveAIError("Failed to get AI response");
        }
    }
    
    public void ReceiveAIResponse(string response)
    {
        Debug.Log("AI Response: " + response);
        // Display in UI
    }
    
    public void ReceiveAIError(string error)
    {
        Debug.LogError("AI Error: " + error);
    }
}

[Serializable]
public class AIRequest
{
    public int siteId;
    public string question = "";
    public string language = "mn";
}

[Serializable]
public class AIResponse
{
    public string response;
    public bool cached;
}
```

## Step 6: Build for WebGL

1. Go to **File > Build Settings**
2. Ensure **WebGL** is selected
3. Click "Build"
4. Choose output folder: `d:\orkhon-app\public\unity-build`
5. Wait for build to complete (may take 10-30 minutes)

## Step 7: Test Integration

1. Ensure Next.js dev server is running: `npm run dev`
2. Navigate to `http://localhost:3000/tours`
3. Click "VR/AR Аялал" button
4. Unity player should load

## Communication Between Unity and React

### From React to Unity:
```javascript
sendMessage('GameManager', 'LoadSites', JSON.stringify(sitesData));
```

### From Unity to React:
```csharp
// In Unity script
Application.ExternalCall("OnSiteSelected", siteId);
```

## Troubleshooting

### Unity Build Fails
- Check Unity version (must be 2022 LTS)
- Ensure WebGL platform is installed
- Check console for specific errors

### WebGL Player Doesn't Load
- Check browser console for errors
- Ensure all build files are in `/public/unity-build/`
- Try different browser (Chrome recommended)

### API Calls Fail
- Check CORS settings
- Ensure Next.js server is running
- Verify API endpoints are accessible

## Next Steps

1. Create 360° panoramic images for each site
2. Implement VR360Controller for image viewing
3. Add AR features for mobile deployment
4. Test AI guide functionality
5. Optimize WebGL build size

## Resources

- [Unity AR Foundation Documentation](https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@4.2/manual/index.html)
- [Unity WebGL Documentation](https://docs.unity3d.com/Manual/webgl.html)
- [Firebase Unity SDK](https://firebase.google.com/docs/unity/setup)

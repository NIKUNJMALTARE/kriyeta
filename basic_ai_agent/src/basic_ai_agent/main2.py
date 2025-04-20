import os
from crewai import Agent, Task, Crew, Process, LLM

ollama_llm = LLM(
    model='ollama/mistral',
    base_url='http://localhost:11434',
)

# Define your agents
researcher = Agent(
    role="Researcher",
    goal="Conduct thorough research and analysis on AI and AI agents",
    backstory="You're an expert researcher, specialized in technology, software engineering, AI, and startups. You work as a freelancer and are currently researching for a new client.",
    allow_delegation=False,
    llm=ollama_llm,
)

writer = Agent(
    role="Senior Writer",
    goal="Create compelling content about AI and AI agents",
    backstory="You're a senior writer, specialized in technology, software engineering, AI, and startups. You work as a freelancer and are currently writing content for a new client.",
    allow_delegation=False,
    llm=ollama_llm,
)

analyst = Agent(
    role="Data Analyst",
    goal="Analyze datasets and extract actionable insights",
    backstory="A detail-oriented analyst who loves finding hidden patterns. Previously worked at a fintech startup analyzing customer behavior.",
    allow_delegation=False,
    llm=ollama_llm,
)

strategist = Agent(
    role="Business Strategist",
    goal="Create and validate business strategies for startups and enterprises",
    backstory="MBA from a top school and former McKinsey consultant. You help companies scale smart and fast.",
    allow_delegation=True,
    llm=ollama_llm,
)

# Define your task
task = Task(
    description="Generate a list of 5 interesting ideas for an article, then analyis the demand of those topic among the children, and create a strategy to advertise those topics to children.",
    expected_output="3 points about ideas for an article, 3 points about the demand of those topics among children, and 3 points about the strategy to advertise those topics to children",
)


# Define the manager agent
manager = Agent(
    role="Project Manager",
    goal="Efficiently manage the crew and ensure high-quality task completion",
    backstory="You're an experienced project manager, skilled in overseeing complex projects and guiding teams to success. Your role is to coordinate the efforts of the crew members, ensuring that each task is completed on time and to the highest standard.",
    allow_delegation=True,
    llm=ollama_llm,
)

# Instantiate your crew with a custom manager
crew = Crew(
    agents=[researcher, writer, analyst, strategist],
    tasks=[task],
    manager_agent=manager,
    process=Process.hierarchical,
    verbose=True,
)

# Start the crew's work
result = crew.kickoff()

print(result)